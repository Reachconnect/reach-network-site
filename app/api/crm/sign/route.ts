// /api/crm/sign: e-signatures in the CRM (agency staff only)
//
// GET ?view=overview                    documents and templates (also sends any reminders that are due)
// GET ?view=envelope&id=                one document: signers, history, links to the PDFs
// GET ?view=template&id=                one template
// GET ?view=prefill&company=|candidate= what to fill in for a client or candidate
//
// POST actions: template_save, template_delete, upload, send, remind, void
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";
import { SIGN_BUCKET, SIGNED_BUCKET, newSignToken, sha256, shortId } from "@/lib/esign";
import { logEvent, sendDueReminders, sendInvite } from "@/lib/esignFlow";
import { AGENCY, fillTemplate, ukDateLong } from "@/lib/esignText";
import { EMAIL_RE } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const safePath = (v: unknown) => (typeof v === "string" && /^[\w\-./]+$/.test(v) && !v.includes("..") ? v : null);
const money = (n: number) => `£${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return fail("Please log in again.", 401);
  const db = admin();
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "overview";
  const id = url.searchParams.get("id") || "";

  if (view === "overview") {
    await sendDueReminders(db).catch(() => 0);
    const [{ data: envelopes, error }, { data: templates }] = await Promise.all([
      db.from("crm_sign_envelopes").select("id, title, kind, status, company_id, company_name, candidate_id, sent_at, completed_at, created_at, crm_sign_signers(name, email, viewed_at, signed_at, declined_at)").order("created_at", { ascending: false }).limit(200),
      db.from("crm_sign_templates").select("id, name, kind, doc_kind, description, updated_at").order("name"),
    ]);
    if (error) return fail(`${error.message}. Has the e-signature SQL been run?`, 500);
    return NextResponse.json({ envelopes, templates });
  }

  if (view === "envelope") {
    const { data: env } = await db.from("crm_sign_envelopes").select("*").eq("id", id).maybeSingle();
    if (!env) return fail("Document not found.", 404);
    const [{ data: signers }, { data: events }, signed, original] = await Promise.all([
      db.from("crm_sign_signers").select("id, name, email, job_title, viewed_at, verified_at, signed_at, declined_at, decline_reason, reminded_at, reminder_count, token, ip, user_agent").eq("envelope_id", id).order("order_no"),
      db.from("crm_sign_events").select("*").eq("envelope_id", id).order("at"),
      env.signed_pdf_path ? db.storage.from(SIGNED_BUCKET).createSignedUrl(env.signed_pdf_path, 600, { download: env.signed_filename || "signed.pdf" }) : Promise.resolve({ data: null }),
      env.pdf_path ? db.storage.from(SIGN_BUCKET).createSignedUrl(env.pdf_path, 600) : Promise.resolve({ data: null }),
    ]);
    return NextResponse.json({ envelope: { ...env, short_id: shortId(env.id) }, signers, events, signed_url: signed.data?.signedUrl ?? null, original_url: original.data?.signedUrl ?? null });
  }

  if (view === "template") {
    const { data: t } = await db.from("crm_sign_templates").select("*").eq("id", id).maybeSingle();
    if (!t) return fail("Template not found.", 404);
    const pdf = t.pdf_path ? (await db.storage.from(SIGN_BUCKET).createSignedUrl(t.pdf_path, 600)).data?.signedUrl ?? null : null;
    return NextResponse.json({ template: t, pdf_url: pdf });
  }

  if (view === "prefill") {
    const companyId = url.searchParams.get("company");
    const candidateId = url.searchParams.get("candidate");
    const values: Record<string, string> = { date: ukDateLong() };
    let contacts: { name: string; email: string | null; job_title: string | null; is_primary: boolean }[] = [];
    let company: { id: string; name: string } | null = null;
    let candidate: { id: string; name: string; email: string | null } | null = null;
    if (companyId) {
      const { data: c } = await db.from("crm_companies").select("*").eq("id", companyId).maybeSingle();
      if (c) {
        company = { id: c.id, name: c.name };
        values.company = c.name || "";
        values.company_address = [c.address, c.postcode].filter(Boolean).join(", ");
        if (c.fee_type === "fixed" && c.perm_fee_fixed) {
          values.fee_fixed = String(c.perm_fee_fixed);
          values.fee = `a fixed fee of ${money(Number(c.perm_fee_fixed))}`;
        } else if (c.perm_fee_percent) {
          values.fee_percent = String(Number(c.perm_fee_percent));
          values.fee = `${Number(c.perm_fee_percent)}% of the candidate's first-year basic salary`;
        }
        if (c.rebate_weeks) values.rebate_weeks = String(c.rebate_weeks);
        if (c.payment_days) values.payment_days = String(c.payment_days);
        const { data: cs } = await db.from("crm_contacts").select("*").eq("company_id", c.id).order("is_primary", { ascending: false });
        contacts = (cs ?? []).map((x) => ({ name: x.name, email: x.email, job_title: x.job_title ?? null, is_primary: !!x.is_primary }));
        const main = contacts.find((x) => x.email) || contacts[0];
        if (main) {
          values.contact_name = main.name || "";
          values.contact_job_title = main.job_title || "";
        }
      }
    }
    if (candidateId) {
      const { data: c } = await db.from("crm_candidates").select("*").eq("id", candidateId).maybeSingle();
      if (c) {
        const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
        candidate = { id: c.id, name, email: c.email ?? null };
        values.candidate_name = name;
      }
    }
    return NextResponse.json({ values, contacts, company, candidate });
  }

  return fail("Unknown view.");
}

export async function POST(request: Request) {
  const userId = await requireAgency(request);
  if (!userId) return fail("Please log in again.", 401);
  const body = await request.json().catch(() => ({}));
  const db = admin();
  const action = body.action;

  if (action === "upload") {
    const path = `templates/${new Date().toISOString().slice(0, 10)}/${newSignToken().slice(0, 20)}.pdf`;
    const { data, error } = await db.storage.from(SIGN_BUCKET).createSignedUploadUrl(path);
    if (error || !data) return fail(`Couldn't get ready to upload: ${error?.message || "unknown"}. Has the signatures bucket been created?`, 500);
    return NextResponse.json({ bucket: SIGN_BUCKET, path: data.path, token: data.token });
  }

  if (action === "template_save") {
    const kind = body.kind === "pdf" ? "pdf" : "text";
    const row = {
      name: str(body.name, 160) || "Untitled template",
      description: str(body.description, 300) || null,
      kind,
      doc_kind: ["terms", "contract", "other"].includes(body.doc_kind) ? body.doc_kind : "other",
      body: kind === "text" ? String(body.body || "").slice(0, 100000) : null,
      pdf_path: kind === "pdf" ? safePath(body.pdf_path) : null,
      updated_at: new Date().toISOString(),
    };
    if (kind === "pdf" && !row.pdf_path) return fail("Upload the PDF first.");
    if (body.id) {
      const { error } = await db.from("crm_sign_templates").update(row).eq("id", body.id);
      if (error) return fail(error.message, 500);
      return NextResponse.json({ id: body.id });
    }
    const { data, error } = await db.from("crm_sign_templates").insert({ ...row, created_by: userId }).select("id").single();
    if (error) return fail(error.message, 500);
    return NextResponse.json({ id: data.id });
  }

  if (action === "template_delete") {
    await db.from("crm_sign_templates").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  // ---------- Send a document to sign ----------
  if (action === "send") {
    const title = str(body.title, 160);
    if (!title) return fail("Give the document a title.");
    const kind = ["terms", "contract", "other"].includes(body.kind) ? body.kind : "other";
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.fields || {})) if (typeof v === "string") values[k.toLowerCase()] = v.slice(0, 500);

    const signers = (Array.isArray(body.signers) ? body.signers : [])
      .map((s: { name?: unknown; email?: unknown; job_title?: unknown }) => ({ name: str(s.name, 120), email: str(s.email, 200).toLowerCase(), job_title: str(s.job_title, 120) || null }))
      .filter((s: { name: string; email: string }) => s.name || s.email)
      .slice(0, 5);
    if (!signers.length) return fail("Add who needs to sign.");
    const bad = signers.find((s: { name: string; email: string }) => !s.name || !EMAIL_RE.test(s.email));
    if (bad) return fail(`Add a name and a valid email for every signer${bad.name ? ` (check ${bad.name})` : ""}.`);

    // The document: written terms, or an uploaded PDF
    let docBody: string | null = null;
    let pdfPath: string | null = null;
    let docHash = "";
    const { data: template } = body.template_id ? await db.from("crm_sign_templates").select("*").eq("id", body.template_id).maybeSingle() : { data: null };
    const isPdf = template ? template.kind === "pdf" : !!body.pdf_path;
    if (isPdf) {
      const source = template?.pdf_path || safePath(body.pdf_path);
      if (!source) return fail("Choose or upload the PDF to send.");
      const { data: file, error } = await db.storage.from(SIGN_BUCKET).download(source);
      if (error || !file) return fail("Couldn't read that PDF.", 500);
      const bytes = new Uint8Array(await file.arrayBuffer());
      docHash = sha256(bytes);
      pdfPath = `sent/${new Date().toISOString().slice(0, 10)}/${newSignToken().slice(0, 20)}.pdf`;
      const up = await db.storage.from(SIGN_BUCKET).upload(pdfPath, bytes, { contentType: "application/pdf" });
      if (up.error) return fail(`Couldn't save a copy of the PDF: ${up.error.message}`, 500);
    } else {
      const source = typeof body.body === "string" && body.body.trim() ? body.body : template?.body || "";
      if (!source.trim()) return fail("The document is empty.");
      docBody = fillTemplate(source, values);
      const missing = Array.from(new Set(Array.from(docBody.matchAll(/\[([a-z_]+)\]/g)).map((m) => m[1])));
      if (missing.length) return fail(`Fill these in before sending: ${missing.map((m) => m.replace(/_/g, " ")).join(", ")}.`);
      docHash = sha256(docBody);
    }

    const company = body.company_id ? (await db.from("crm_companies").select("id, name, stage").eq("id", body.company_id).maybeSingle()).data : null;
    const now = new Date().toISOString();
    const senderSigns = !!body.sender_signs;
    const { data: env, error } = await db
      .from("crm_sign_envelopes")
      .insert({
        title,
        kind,
        template_id: template?.id || null,
        company_id: company?.id || null,
        company_name: company?.name || str(body.company_name, 160) || null,
        candidate_id: str(body.candidate_id, 40) || null,
        body: docBody,
        pdf_path: pdfPath,
        doc_hash: docHash,
        fields: values,
        message: str(body.message, 1500) || null,
        status: "sent",
        sent_at: now,
        sender_name: AGENCY.signer,
        sender_title: AGENCY.signerTitle,
        sender_signed_at: senderSigns ? now : null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) return fail(`Couldn't create the document: ${error.message}. Has the e-signature SQL been run?`, 500);

    const rows = signers.map((s: { name: string; email: string; job_title: string | null }, i: number) => ({ ...s, envelope_id: env.id, order_no: i + 1, token: newSignToken() }));
    const { data: saved, error: sErr } = await db.from("crm_sign_signers").insert(rows).select("*");
    if (sErr) return fail(`Couldn't add the signers: ${sErr.message}`, 500);

    await logEvent(db, env.id, `Document created by ${AGENCY.signer}. Fingerprint SHA-256 ${docHash.slice(0, 16)}…`, { event: "created" });
    if (senderSigns) await logEvent(db, env.id, `Signed by ${AGENCY.signer} for ${AGENCY.name} when sending`, { event: "sender_signed" });
    const failures: string[] = [];
    for (const s of saved ?? []) {
      const out = await sendInvite(env, s);
      if (out.ok) await logEvent(db, env.id, `Emailed to ${s.name} (${s.email}) to sign`, { signerId: s.id, event: "sent" });
      else failures.push(`${s.email}: ${out.error}`);
    }

    if (company) {
      await db.from("crm_notes").insert({ company_id: company.id, kind: "note", body: `Sent to sign: ${title} (to ${signers.map((s: { name: string }) => s.name).join(", ")}).` });
      if (kind === "terms" && ["lead", "contacted", "meeting"].includes(company.stage)) await db.from("crm_companies").update({ stage: "terms_sent" }).eq("id", company.id);
    }
    if (env.candidate_id) await db.from("crm_notes").insert({ candidate_id: env.candidate_id, kind: "note", body: `Sent to sign: ${title}.` });

    return NextResponse.json({ id: env.id, failures });
  }

  const { data: env } = body.id ? await db.from("crm_sign_envelopes").select("*").eq("id", body.id).maybeSingle() : { data: null };
  if (!env) return fail("Document not found.", 404);

  if (action === "remind") {
    if (env.status !== "sent") return fail("This document isn't waiting for signatures.");
    const { data: signers } = await db.from("crm_sign_signers").select("*").eq("envelope_id", env.id).is("signed_at", null).is("declined_at", null);
    let n = 0;
    for (const s of signers ?? []) {
      const out = await sendInvite(env, s, true);
      if (out.ok) {
        n++;
        await db.from("crm_sign_signers").update({ reminded_at: new Date().toISOString() }).eq("id", s.id);
        await logEvent(db, env.id, `Reminder emailed to ${s.email}`, { signerId: s.id, event: "reminded" });
      }
    }
    return NextResponse.json({ reminded: n });
  }

  if (action === "void") {
    if (env.status === "completed") return fail("This document is already signed, so it can't be cancelled.");
    await db.from("crm_sign_envelopes").update({ status: "void" }).eq("id", env.id);
    await logEvent(db, env.id, `Cancelled by ${AGENCY.signer}${str(body.reason) ? `: ${str(body.reason)}` : ""}`, { event: "void" });
    return NextResponse.json({ ok: true });
  }

  return fail("Unknown action.");
}

