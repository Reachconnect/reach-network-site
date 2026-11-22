// GET /api/m/c/[token]?u=...&s=...: a tracked link in a campaign email. Records the click, then sends them on.
import { NextResponse } from "next/server";
import { admin } from "@/lib/crmServer";
import { MAIL_FILES_BUCKET, sign } from "@/lib/mail";
import { SITE_URL, sendAlert } from "@/lib/specs";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const q = new URL(request.url).searchParams;
  const target = q.get("u") || "";
  if (!target || q.get("s") !== sign(token, target)) return NextResponse.redirect(SITE_URL);

  const db = admin();
  let destination = target;
  if (target.startsWith("file:")) {
    const path = target.slice(5);
    const name = path.split("/").pop() || "file";
    const { data: f } = await db.storage.from(MAIL_FILES_BUCKET).createSignedUrl(path, 3600, { download: name });
    destination = f?.signedUrl || SITE_URL;
  } else if (!/^https?:\/\//i.test(target)) {
    destination = SITE_URL;
  } else {
    // Our own website: pass who they are, so their visit can show in the CRM (only if they accept cookies)
    try {
      const u = new URL(target);
      if (u.host.replace(/^www\./, "") === new URL(SITE_URL).host.replace(/^www\./, "")) {
        u.searchParams.set("rnr", token);
        destination = u.toString();
      }
    } catch {
      // leave it as it is
    }
  }

  try {
    const { data: s } = await db.from("crm_mail_sends").select("*").eq("token", token).maybeSingle();
    // Company email scanners "click" every link as soon as the email lands. Ignore those.
    const scanner = s?.sent_at && Date.now() - new Date(s.sent_at).getTime() < 30 * 1000;
    if (s && scanner) {
      await db.from("crm_mail_clicks").insert({ send_id: s.id, url: target, ignored: true });
    } else if (s) {
      const now = new Date().toISOString();
      await Promise.all([
        db.from("crm_mail_clicks").insert({ send_id: s.id, url: target }),
        db
          .from("crm_mail_sends")
          .update({ clicked_at: s.clicked_at || now, click_count: (s.click_count || 0) + 1, opened_at: s.opened_at || now })
          .eq("id", s.id),
      ]);
      // First click from this person: let the recruiter know so they can call
      if (!s.clicked_at) {
        const { data: c } = await db.from("crm_mail_campaigns").select("id, name, alert_on_click").eq("id", s.campaign_id).maybeSingle();
        if (c?.alert_on_click) {
          const who = [s.first_name, s.last_name].filter(Boolean).join(" ") || s.email;
          await sendAlert(
            `🔥 ${who}${s.company ? ` at ${s.company}` : ""} clicked your email`,
            [
              `${who}${s.job_title ? `, ${s.job_title}` : ""}${s.company ? ` at ${s.company}` : ""} clicked a link in "${c.name}".`,
              `Email: ${s.email}${s.phone ? ` · Phone: ${s.phone}` : ""}`,
              "Now's a good time to give them a call.",
            ],
            { label: "Open the campaign", url: `${SITE_URL}/crm/email/campaign?id=${c.id}` }
          );
        }
      }
    }
  } catch {
    // never stop them getting where they were going
  }
  return NextResponse.redirect(destination, 302);
}
