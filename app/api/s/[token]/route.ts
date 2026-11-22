// POST /api/s/[token]: the signer's page (public, the link in their email is their key)
// actions: open, send_code, verify, sign, decline, download
import crypto from "crypto";
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { SIGNED_BUCKET, emailLayout, requestInfo, sendMail, sha256, shortId } from "@/lib/esign";
import { alertDarren, completeEnvelope, logEvent } from "@/lib/esignFlow";
import { AGENCY } from "@/lib/esignText";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const CODE_MINUTES = 15;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const db = admin();
  const { ip, ua } = requestInfo(request);

  const { data: s } = await db.from("crm_sign_signers").select("*, crm_sign_envelopes(*)").eq("token", token).maybeSingle();
  if (!s || !s.crm_sign_envelopes) return fail("This signing link isn't valid.", 404);
  const env = s.crm_sign_envelopes;
  const who = `${s.name} (${s.email})`;
  const action = body.action;

  if (action === "download") {
    if (env.status !== "completed" || !env.signed_pdf_path) return fail("The signed copy isn't ready yet.");
    const { data } = await db.storage.from(SIGNED_BUCKET).createSignedUrl(env.signed_pdf_path, 600, { download: env.signed_filename || "signed.pdf" });
    return NextResponse.json({ url: data?.signedUrl ?? null });
  }

  if (env.status === "void") return fail("This document has been cancelled.");
  if (env.status === "completed" || s.signed_at) return NextResponse.json({ done: true });
  if (s.declined_at || env.status === "declined") return fail("This document has been declined.");

  if (action === "open") {
    if (!s.viewed_at) {
      await db.from("crm_sign_signers").update({ viewed_at: new Date().toISOString() }).eq("id", s.id);
      await logEvent(db, env.id, `Opened by ${who}`, { signerId: s.id, event: "viewed", ip, ua });
      await alertDarren(`👀 ${s.name} opened "${env.title}"`, [`${who}${env.company_name ? ` at ${env.company_name}` : ""} has just opened "${env.title}".`], env.id);
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "send_code") {
    if (s.code_sent_at && Date.now() - new Date(s.code_sent_at).getTime() < 30 * 1000) return fail("A code was sent a moment ago. Check your inbox (and junk folder).");
    if ((s.codes_sent || 0) >= 8) return fail(`Too many codes requested. Reply to the email and ${AGENCY.signer} will help.`);
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    await db
      .from("crm_sign_signers")
      .update({ code_hash: sha256(`${code}:${s.id}`), code_sent_at: new Date().toISOString(), code_tries: 0, codes_sent: (s.codes_sent || 0) + 1 })
      .eq("id", s.id);
    const out = await sendMail({
      to: s.email,
      subject: `Your signing code: ${code}`,
      html: emailLayout([`Your code to sign "${env.title}" is:`, code, `It works for ${CODE_MINUTES} minutes. If you didn't ask for it, you can ignore this email.`], undefined, `Document ID ${shortId(env.id)}`).replace(`color:#0F2438">${code}</p>`, `color:#0F2438;font-size:30px;letter-spacing:6px;font-weight:bold">${code}</p>`),
      text: `Your code to sign "${env.title}" is ${code}. It works for ${CODE_MINUTES} minutes.`,
    });
    if (!out.ok) return fail("We couldn't send the code. Please try again in a minute.", 502);
    await logEvent(db, env.id, `One-time code emailed to ${s.email}`, { signerId: s.id, event: "code_sent", ip, ua });
    return NextResponse.json({ ok: true });
  }

  if (action === "verify") {
    if (!s.code_hash || !s.code_sent_at) return fail("Ask for a code first.");
    if (Date.now() - new Date(s.code_sent_at).getTime() > CODE_MINUTES * 60 * 1000) return fail("That code has run out. Ask for a new one.");
    if ((s.code_tries || 0) >= 5) return fail("Too many wrong tries. Ask for a new code.");
    const code = String(body.code || "").replace(/\D/g, "");
    if (sha256(`${code}:${s.id}`) !== s.code_hash) {
      await db.from("crm_sign_signers").update({ code_tries: (s.code_tries || 0) + 1 }).eq("id", s.id);
      return fail("That code isn't right. Check the latest email and try again.");
    }
    await db.from("crm_sign_signers").update({ verified_at: new Date().toISOString(), code_hash: null }).eq("id", s.id);
    await logEvent(db, env.id, `${who} confirmed their email address with the one-time code`, { signerId: s.id, event: "verified", ip, ua });
    return NextResponse.json({ ok: true });
  }

  if (action === "sign") {
    if (!s.verified_at || Date.now() - new Date(s.verified_at).getTime() > 6 * 3600 * 1000) return fail("Please confirm your email with a code first.");
    if (!body.agree) return fail("Tick the box to confirm you agree.");
    const name = String(body.name || "").trim().slice(0, 120);
    if (name.length < 2) return fail("Type your full name.");
    const type = body.type === "drawn" ? "drawn" : "typed";
    const data = type === "drawn" ? String(body.data || "") : name;
    if (type === "drawn" && (!data.startsWith("data:image/png;base64,") || data.length < 1500 || data.length > 600000)) return fail("Draw your signature in the box.");
    const jobTitle = String(body.job_title || "").trim().slice(0, 120) || s.job_title;
    const now = new Date().toISOString();
    const { data: updated } = await db
      .from("crm_sign_signers")
      .update({ signed_at: now, signed_name: name, job_title: jobTitle, signature_type: type, signature_data: data, ip, user_agent: ua })
      .eq("id", s.id)
      .is("signed_at", null)
      .select("id");
    if (!updated?.length) return NextResponse.json({ done: true });
    await logEvent(db, env.id, `Signed by ${name}${jobTitle ? `, ${jobTitle}` : ""} (${s.email}), ${type === "drawn" ? "drawn signature" : "typed signature"}. Agreed to the document and confirmed authority to sign.`, { signerId: s.id, event: "signed", ip, ua });

    const { data: all } = await db.from("crm_sign_signers").select("signed_at, declined_at").eq("envelope_id", env.id);
    const waiting = (all ?? []).filter((x) => !x.signed_at).length;
    await alertDarren(
      `✍️ ${name} signed "${env.title}"`,
      [`${name}${jobTitle ? `, ${jobTitle}` : ""}${env.company_name ? ` at ${env.company_name}` : ""} has signed "${env.title}".`, waiting ? `Still waiting for ${waiting} more.` : "That's everyone. The signed copy is on its way to you."],
      env.id
    );
    if (!waiting) await completeEnvelope(db, env.id);
    return NextResponse.json({ done: true, completed: !waiting });
  }

  if (action === "decline") {
    const reason = String(body.reason || "").trim().slice(0, 500);
    await db.from("crm_sign_signers").update({ declined_at: new Date().toISOString(), decline_reason: reason || null, ip, user_agent: ua }).eq("id", s.id);
    await db.from("crm_sign_envelopes").update({ status: "declined" }).eq("id", env.id);
    await logEvent(db, env.id, `Declined by ${who}${reason ? `: ${reason}` : ""}`, { signerId: s.id, event: "declined", ip, ua });
    await alertDarren(`❌ ${s.name} declined "${env.title}"`, [`${who} declined to sign "${env.title}".`, reason ? `Their reason: ${reason}` : "They didn't give a reason.", "Worth a call to find out what they'd like changed."], env.id);
    return NextResponse.json({ ok: true });
  }

  return fail("Unknown action.");
}
