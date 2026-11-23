// Puts an enquiry from the website into the CRM: company (as a lead), contact, note, reminder and an alert email
import { admin } from "./crmServer";
import { SITE_URL, sendAlert } from "./specs";

export async function addWebsiteLead(l: {
  company: string;
  name: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  source: string;
  details: string[];
  reminder: string;
  dueAt?: string;
  alertSubject: string;
}) {
  const db = admin();
  const name = (l.company || l.name).trim().slice(0, 160);
  const { data: found } = await db.from("crm_companies").select("id").ilike("name", name).limit(1);
  let companyId = found?.[0]?.id as string | undefined;
  if (!companyId) {
    const { data, error } = await db.from("crm_companies").insert({ name, stage: "lead", source: l.source, last_contacted_at: new Date().toISOString() }).select("id").single();
    if (error) throw error;
    companyId = data.id;
  }
  const email = l.email.trim().toLowerCase();
  const { data: contact } = await db.from("crm_contacts").select("id").eq("company_id", companyId).ilike("email", email).limit(1);
  if (!contact?.length) {
    await db.from("crm_contacts").insert({ company_id: companyId, name: l.name.trim(), email, phone: l.phone?.trim() || null, job_title: l.jobTitle?.trim() || null, is_primary: !found?.length });
  }
  const details = l.details.filter(Boolean);
  await db.from("crm_notes").insert({ company_id: companyId, kind: "note", body: details.join("\n") });
  await db.from("crm_reminders").insert({ company_id: companyId, title: l.reminder, due_at: l.dueAt || new Date().toISOString() });
  await sendAlert(l.alertSubject, details, { label: "Open in the CRM", url: `${SITE_URL}/crm/sales/view?id=${companyId}` });
  return companyId;
}
