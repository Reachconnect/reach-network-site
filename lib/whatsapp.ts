// Server only: one place that talks to WhatsApp.
//
// If TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM are set,
// messages go through Twilio. Otherwise they go straight to Meta, as before.
// Remove the Twilio settings in Vercel to switch back.

const GRAPH = "https://graph.facebook.com/v21.0";
const TWILIO_API = "https://api.twilio.com/2010-04-01";
const TWILIO_CONTENT = "https://content.twilio.com/v1";

export const APP_URL = (process.env.APP_URL || "https://reachnetworkconnect.com").replace(/\/$/, "");
export const TWILIO_WEBHOOK_URL = `${APP_URL}/api/twilio/webhook`;

export type SendResult = { ok: boolean; id: string | null; error: string | null; code: string | null };

export function usingTwilio() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

export function whatsappConfigured() {
  if (usingTwilio()) return true;
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

// Digits only, UK numbers in 44 format (e.g. 447700900123)
export function cleanPhone(raw: string) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "44" + digits.slice(1);
  return digits;
}

// WhatsApp rejects template values that are empty or contain line breaks, tabs or long runs of spaces
export function cleanParam(value: unknown) {
  const v = String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim();
  return v || "-";
}

function twilioAuth() {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");
}

function twilioFrom() {
  return `whatsapp:+${cleanPhone(process.env.TWILIO_WHATSAPP_FROM || "")}`;
}

async function twilioSend(fields: Record<string, string>): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  try {
    const res = await fetch(`${TWILIO_API}/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: twilioAuth(), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: twilioFrom(), StatusCallback: TWILIO_WEBHOOK_URL, ...fields }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        id: null,
        error: data?.message || `Twilio error ${res.status}`,
        code: data?.code != null ? String(data.code) : null,
      };
    }
    return { ok: true, id: data?.sid ?? null, error: null, code: null };
  } catch (e) {
    return { ok: false, id: null, error: (e as Error).message, code: null };
  }
}

async function metaSend(payload: Record<string, unknown>): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) return { ok: false, id: null, error: "WhatsApp is not configured.", code: null };
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        id: null,
        error: data?.error?.message || `WhatsApp error ${res.status}`,
        code: data?.error?.code != null ? String(data.error.code) : null,
      };
    }
    return { ok: true, id: data?.messages?.[0]?.id ?? null, error: null, code: null };
  } catch (e) {
    return { ok: false, id: null, error: (e as Error).message, code: null };
  }
}

// A normal message. Only works within 24 hours of their last message.
export async function sendText(to: string, body: string): Promise<SendResult> {
  const phone = cleanPhone(to);
  if (!phone) return { ok: false, id: null, error: "No phone number.", code: null };
  if (usingTwilio()) return twilioSend({ To: `whatsapp:+${phone}`, Body: body });
  return metaSend({ to: phone, type: "text", text: { body } });
}

// An approved template, filling {{1}}, {{2}}... with params in order
export async function sendTemplate(to: string, name: string, params: string[] = [], language = "en"): Promise<SendResult> {
  const phone = cleanPhone(to);
  if (!phone) return { ok: false, id: null, error: "No phone number.", code: null };
  const values = params.map(cleanParam);

  if (usingTwilio()) {
    const template = await findTwilioTemplate(name, language);
    if (!template) {
      return { ok: false, id: null, error: `Template "${name}" isn't set up or approved in Twilio yet.`, code: null };
    }
    const variables: Record<string, string> = {};
    values.forEach((v, i) => (variables[String(i + 1)] = v));
    return twilioSend({
      To: `whatsapp:+${phone}`,
      ContentSid: template.sid,
      ...(values.length ? { ContentVariables: JSON.stringify(variables) } : {}),
    });
  }

  return metaSend({
    to: phone,
    type: "template",
    template: {
      name,
      language: { code: language },
      ...(values.length ? { components: [{ type: "body", parameters: values.map((text) => ({ type: "text", text })) }] } : {}),
    },
  });
}

// =====================================================================
// Templates
// =====================================================================

export type Template = { sid: string; name: string; language: string; status: string; category: string; body: string };

let cache: { at: number; list: Template[] } | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bodyOf(types: any): string {
  if (!types) return "";
  for (const key of Object.keys(types)) {
    const t = types[key];
    if (typeof t?.body === "string" && t.body) return t.body;
  }
  return "";
}

async function loadTwilioTemplates(): Promise<Template[]> {
  if (cache && Date.now() - cache.at < 2 * 60 * 1000) return cache.list;

  const list: Template[] = [];
  let url: string | null = `${TWILIO_CONTENT}/ContentAndApprovals?PageSize=100`;
  let pages = 0;
  while (url && pages < 10) {
    pages++;
    const res: Response = await fetch(url, { headers: { Authorization: twilioAuth() }, cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || `Twilio error ${res.status}`);
    for (const c of json?.contents ?? []) {
      const approval = c?.approval_requests || {};
      list.push({
        sid: c.sid,
        name: c.friendly_name,
        language: c.language || "en",
        status: String(approval.status || "unsubmitted").toLowerCase(),
        category: String(approval.category || "").toUpperCase(),
        body: bodyOf(c.types),
      });
    }
    url = json?.meta?.next_page_url || null;
  }

  cache = { at: Date.now(), list };
  return list;
}

async function findTwilioTemplate(name: string, language: string) {
  const list = await loadTwilioTemplates().catch(() => [] as Template[]);
  const approved = list.filter((t) => t.name === name && t.status === "approved");
  const lang = language.toLowerCase().replace("-", "_");
  return (
    approved.find((t) => t.language.toLowerCase().replace("-", "_") === lang) ||
    approved.find((t) => t.language.toLowerCase().startsWith(lang.slice(0, 2))) ||
    approved[0] ||
    null
  );
}

// Approved templates, in the same shape for Twilio or Meta
export async function listApprovedTemplates(): Promise<{ templates: Template[] } | { error: string }> {
  if (usingTwilio()) {
    try {
      const list = await loadTwilioTemplates();
      return { templates: list.filter((t) => t.status === "approved") };
    } catch (e) {
      return { error: `Couldn't load templates from Twilio: ${(e as Error).message}` };
    }
  }

  const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!waba || !token) return { error: "WhatsApp business account isn't configured." };

  const res = await fetch(
    `${GRAPH}/${waba}/message_templates?fields=name,language,status,category,components&limit=200`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json?.error?.message || "Couldn't load templates from WhatsApp." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const templates = ((json.data ?? []) as any[])
    .filter((t) => t.status === "APPROVED")
    .map((t) => ({
      sid: String(t.id || ""),
      name: t.name,
      language: t.language,
      status: "approved",
      category: t.category ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: t.components?.find((c: any) => c.type === "BODY")?.text ?? "",
    }));
  return { templates };
}

// =====================================================================
// Downloading photos / documents people send us
// =====================================================================

// ref is a Twilio media URL, or a Meta media ID
export async function downloadMedia(ref: string, fallbackMime?: string): Promise<{ buffer: ArrayBuffer; mime: string } | null> {
  try {
    if (/^https?:\/\//.test(ref)) {
      const res = await fetch(ref, { headers: { Authorization: twilioAuth() } });
      if (!res.ok) return null;
      const mime = String(res.headers.get("content-type") || fallbackMime || "application/octet-stream").split(";")[0].trim();
      return { buffer: await res.arrayBuffer(), mime };
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!token) return null;
    const infoRes = await fetch(`${GRAPH}/${ref}`, { headers: { Authorization: `Bearer ${token}` } });
    const info = await infoRes.json();
    if (!infoRes.ok || !info?.url) return null;
    const fileRes = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!fileRes.ok) return null;
    const mime = String(info.mime_type || fallbackMime || "application/octet-stream").split(";")[0].trim();
    return { buffer: await fileRes.arrayBuffer(), mime };
  } catch (e) {
    console.error("Media download failed:", e);
    return null;
  }
}
