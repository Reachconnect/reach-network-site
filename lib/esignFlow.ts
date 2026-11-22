// E-signatures: the steps a document goes through (send, remind, log, complete)
import { admin } from "./crmServer";
import { SITE_URL, sendAlert } from "./specs";
import { AGENCY } from "./esignText";
import { SIGN_BUCKET, SIGNED_BUCKET, buildSignedPdf, emailLayout, sendMail, sha256, shortId, signUrl } from "./esign";

type DB = ReturnType<typeof admin>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export async function logEvent(db: DB, envelopeId: string, detail: string, opts: { signerId?: string | null; event?: string; ip?: string | null; ua?: string | null } = {}) {
  await db.from("crm_sign_events").insert({
    envelope_id: envelopeId,
    signer_id: opts.signerId ?? null,
    event: opts.event || "info",
    detail,
    ip: opts.ip ?? null,
    user_agent: opts.ua ?? null,
  });
}

export async function sendInvite(env: Any, s: Any, reminder = false) {
  const first = (s.name || "").split(" ")[0] || "there";
  const lines = [
    `Hi ${first},`,
    reminder
      ? `Just a reminder: ${env.sender_name || AGENCY.signer} from ${AGENCY.name} has asked you to sign "${env.title}". It only takes a couple of minutes.`
      : `${env.sender_name || AGENCY.signer} from ${AGENCY.name} has sent you "${env.title}" to sign.`,
    ...(env.message && !reminder ? [env.message] : []),
    "You can read it and sign on your phone or computer. There's nothing to download and no account to set up.",
  ];
  const url = signUrl(s.token);
  return sendMail({
    to: s.email,
    subject: `${reminder ? "Reminder: please" : "Please"} sign: ${env.title}`,
    html: emailLayout(lines, { label: "Review and sign", url }, `Questions? Just reply to this email. Document ID ${shortId(env.id)}.`),
    text: `${lines.join("\n\n")}\n\nReview and sign: ${url}\n\nQuestions? Just reply to this email.`,
  });
}

// Reminds anyone who hasn't signed: after 3 days, then again after 3 more. At most 2 reminders.
export async function sendDueReminders(db: DB) {
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: signers } = await db
    .from("crm_sign_signers")
    .select("*, crm_sign_envelopes!inner(*)")
    .is("signed_at", null)
    .is("declined_at", null)
    .lt("reminder_count", 2)
    .eq("crm_sign_envelopes.status", "sent")
    .lt("crm_sign_envelopes.sent_at", cutoff)
    .limit(50);
  let sent = 0;
  for (const s of signers ?? []) {
    const last = s.reminded_at || s.crm_sign_envelopes.sent_at;
    if (new Date(last).getTime() > Date.now() - 3 * 86400000) continue;
    const out = await sendInvite(s.crm_sign_envelopes, s, true);
    if (out.ok) {
      sent++;
      await db.from("crm_sign_signers").update({ reminded_at: new Date().toISOString(), reminder_count: (s.reminder_count || 0) + 1 }).eq("id", s.id);
      await logEvent(db, s.envelope_id, `Automatic reminder emailed to ${s.email}`, { signerId: s.id, event: "reminded" });
    }
  }
  return sent;
}

// Everyone has signed: make the final PDF, store it, email it, update the CRM
export async function completeEnvelope(db: DB, envelopeId: string) {
  const { data: env } = await db.from("crm_sign_envelopes").select("*").eq("id", envelopeId).maybeSingle();
  if (!env || env.status === "completed") return;
  const completedAt = new Date().toISOString();
  // Claim it so two last signatures can't both complete it
  const { data: claimed } = await db.from("crm_sign_envelopes").update({ status: "completed", completed_at: completedAt }).eq("id", env.id).eq("status", "sent").select("id");
  if (!claimed?.length) return;
  env.status = "completed";
  env.completed_at = completedAt;

  await logEvent(db, env.id, "Everyone has signed. Document completed.", { event: "completed" });
  const [{ data: signers }, { data: events }] = await Promise.all([
    db.from("crm_sign_signers").select("*").eq("envelope_id", env.id).order("order_no"),
    db.from("crm_sign_events").select("*").eq("envelope_id", env.id).order("at"),
  ]);

  let originalPdf: Uint8Array | null = null;
  if (env.pdf_path) {
    const { data: file } = await db.storage.from(SIGN_BUCKET).download(env.pdf_path);
    if (file) originalPdf = new Uint8Array(await file.arrayBuffer());
  }
  const { bytes } = await buildSignedPdf({ envelope: env, signers: signers ?? [], events: events ?? [], originalPdf });
  const finalHash = sha256(bytes);
  const safeTitle = env.title.replace(/[^\w\- ]+/g, "").trim() || "Signed document";
  const filename = `${safeTitle} (signed).pdf`;
  const path = `signed/${new Date().toISOString().slice(0, 10)}/${shortId(env.id)}.pdf`;
  await db.storage.from(SIGNED_BUCKET).upload(path, bytes, { contentType: "application/pdf", upsert: true });
  await db.from("crm_sign_envelopes").update({ signed_pdf_path: path, signed_filename: filename, final_hash: finalHash }).eq("id", env.id);

  // Email the signed copy to everyone
  const people = (signers ?? []).filter((s: Any) => s.signed_at);
  const names = people.map((s: Any) => `${s.signed_name || s.name}${s.job_title ? ` (${s.job_title})` : ""}`).join(", ");
  const attachment = [{ filename, content: Buffer.from(bytes).toString("base64") }];
  const lines = [
    `"${env.title}" has been signed by everyone.`,
    `Signed by: ${names}${env.sender_signed_at ? `, and ${env.sender_name || AGENCY.signer} for ${AGENCY.name}` : ""}.`,
    "Your signed copy is attached. Please keep it for your records.",
  ];
  await sendMail({
    to: people.map((s: Any) => s.email),
    subject: `Signed: ${env.title}`,
    html: emailLayout(lines, undefined, `Document ID ${shortId(env.id)}. Fingerprint of this signed PDF: SHA-256 ${finalHash}.`),
    text: `${lines.join("\n\n")}\n\nDocument ID ${shortId(env.id)}.`,
    attachments: attachment,
  });
  await sendMail({
    to: AGENCY.email,
    subject: `✅ Signed: ${env.title}${env.company_name ? ` (${env.company_name})` : ""}`,
    html: emailLayout([`${names} signed "${env.title}".`, "The signed copy is attached and saved in the CRM."], { label: "Open in the CRM", url: `${SITE_URL}/crm/sign/view?id=${env.id}` }),
    text: `${names} signed "${env.title}". ${SITE_URL}/crm/sign/view?id=${env.id}`,
    attachments: attachment,
  });

  // Update the CRM
  const today = new Date().toISOString().slice(0, 10);
  if (env.company_id) {
    await db.from("crm_notes").insert({ company_id: env.company_id, kind: "note", body: `Signed electronically: ${env.title} (by ${names}).` });
    if (env.kind === "terms") {
      const v = env.fields || {};
      const patch: Record<string, unknown> = {
        terms_signed_at: today,
        terms_signed_by: names.slice(0, 200),
        terms_doc_path: path,
        terms_doc_filename: filename,
      };
      if (v.fee_percent && !Number.isNaN(Number(v.fee_percent))) {
        patch.fee_type = "percent";
        patch.perm_fee_percent = Number(v.fee_percent);
      } else if (v.fee_fixed && !Number.isNaN(Number(String(v.fee_fixed).replace(/[£,]/g, "")))) {
        patch.fee_type = "fixed";
        patch.perm_fee_fixed = Number(String(v.fee_fixed).replace(/[£,]/g, ""));
      }
      if (v.rebate_weeks && !Number.isNaN(Number(v.rebate_weeks))) patch.rebate_weeks = Number(v.rebate_weeks);
      if (v.payment_days && !Number.isNaN(Number(v.payment_days))) patch.payment_days = Number(v.payment_days);
      const { error } = await db.from("crm_companies").update(patch).eq("id", env.company_id);
      if (error) {
        // Some older databases may not have every terms column; save the essentials
        await db.from("crm_companies").update({ terms_signed_at: today, terms_doc_path: path, terms_doc_filename: filename }).eq("id", env.company_id);
      }
      const { data: co } = await db.from("crm_companies").select("stage, won_at").eq("id", env.company_id).maybeSingle();
      if (co && co.stage !== "client" && co.stage !== "lost") {
        await db.from("crm_companies").update({ stage: "client", ...(co.won_at ? {} : { won_at: today }) }).eq("id", env.company_id);
      }
    }
  }
  if (env.candidate_id) {
    await db.from("crm_notes").insert({ candidate_id: env.candidate_id, kind: "note", body: `Signed electronically: ${env.title}.` });
  }
}

export async function alertDarren(subject: string, lines: string[], envelopeId: string) {
  await sendAlert(subject, lines, { label: "Open in the CRM", url: `${SITE_URL}/crm/sign/view?id=${envelopeId}` });
}

