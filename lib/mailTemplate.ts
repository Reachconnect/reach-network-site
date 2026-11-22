// The campaign email template. Safe to use in the browser (for previews) and on the server.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://reachnetworkrec.com").replace(/\/$/, "");
export const REPLY_ADDRESS = "darrenrowell@reachnetworkrec.com";

export type Recipient = { first_name: string | null; last_name: string | null; company: string | null; job_title: string | null };

export type CampaignContent = {
  subject: string;
  preheader: string | null;
  body: string;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  files: { path: string; name: string; size: number }[] | null;
  video: { link: string; gif_url: string | null; thumb_url: string | null; title: string; duration: string } | null;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// {first_name}, {last_name}, {company}, {job_title}, with sensible words when they're blank
export function merge(text: string, r: Recipient) {
  return text
    .replace(/\{\s*first_name\s*\}/gi, (r.first_name || "").trim() || "there")
    .replace(/\{\s*last_name\s*\}/gi, (r.last_name || "").trim())
    .replace(/\{\s*company\s*\}/gi, (r.company || "").trim() || "your business")
    .replace(/\{\s*job_title\s*\}/gi, (r.job_title || "").trim());
}

// Plain text with **bold** and web addresses, into simple email HTML
function paragraphsHtml(text: string, link: (url: string) => string) {
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((para) => {
      let h = esc(para.trim());
      h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (u) => `<a href="${link(u.replace(/&amp;/g, "&"))}" style="color:#F7931E">${u}</a>`);
      h = h.replace(/\n/g, "<br>");
      return h ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#0F2438">${h}</p>` : "";
    })
    .join("");
}

function sizeLabel(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

// One person's email. With track=false (previews) links go straight to where they point.
export function buildEmail(c: CampaignContent, r: Recipient, token: string, track = true, trackedLink: (token: string, url: string) => string = (_t, u) => u) {
  const link = (url: string) => (track ? trackedLink(token, url) : url);
  const fileLink = (path: string) => (track ? trackedLink(token, `file:${path}`) : "#");
  const subject = merge(c.subject, r).replace(/\s+/g, " ").trim();
  const body = merge(c.body, r);
  const unsubscribePage = `${SITE_URL}/m/u/${token}`;

  const parts: string[] = [];
  if (c.image_url) parts.push(`<img src="${c.image_url}" alt="" width="560" style="display:block;width:100%;max-width:560px;border:0;border-radius:8px;margin:0 0 20px">`);
  parts.push(paragraphsHtml(body, link));
  if (c.video) {
    const img = c.video.gif_url || c.video.thumb_url;
    parts.push(
      `<div style="margin:4px 0 20px">${img ? `<a href="${link(c.video.link)}"><img src="${img}" alt="Play video: ${esc(c.video.title)}" width="400" style="display:block;width:400px;max-width:100%;border:0;border-radius:8px"></a>` : ""}<a href="${link(c.video.link)}" style="display:inline-block;margin-top:6px;color:#F7931E;font-weight:bold;font-size:14px;text-decoration:none">&#9654; Watch the video (${esc(c.video.duration)})</a></div>`
    );
  }
  if (c.button_text && c.button_url) {
    parts.push(`<p style="margin:8px 0 24px"><a href="${link(c.button_url)}" style="display:inline-block;background:#F7931E;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:8px">${esc(merge(c.button_text, r))}</a></p>`);
  }
  if (c.files?.length) {
    parts.push(
      `<div style="margin:0 0 20px;padding:12px 16px;background:#F8FAFC;border-radius:8px">${c.files
        .map((f) => `<div style="font-size:14px;line-height:1.9"><a href="${fileLink(f.path)}" style="color:#0F2438;font-weight:bold">&#128206; ${esc(f.name)}</a> <span style="color:#94A3B8">(${sizeLabel(f.size)})</span></div>`)
        .join("")}</div>`
    );
  }

  const pixel = track ? `<img src="${SITE_URL}/api/m/o/${token}.gif" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px">` : "";
  const preheader = c.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(merge(c.preheader, r))}</div>` : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff">${preheader}<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px 20px">${parts.join("")}<div style="margin-top:28px;padding-top:14px;border-top:1px solid #E2E8F0;font-size:12px;line-height:1.6;color:#64748B">Reach Network Recruitment · <a href="${link(SITE_URL)}" style="color:#64748B">reachnetworkrec.com</a><br>Don't want these emails? <a href="${unsubscribePage}" style="color:#64748B">Unsubscribe</a> and we won't email you again.</div>${pixel}</div></body></html>`;

  const textParts = [body.replace(/\*\*(.+?)\*\*/g, "$1")];
  if (c.video) textParts.push(`Watch the video (${c.video.duration}): ${link(c.video.link)}`);
  if (c.button_text && c.button_url) textParts.push(`${merge(c.button_text, r)}: ${link(c.button_url)}`);
  for (const f of c.files ?? []) textParts.push(`${f.name}: ${fileLink(f.path)}`);
  textParts.push(`--\nReach Network Recruitment · reachnetworkrec.com\nUnsubscribe: ${unsubscribePage}`);

  return {
    subject,
    html,
    text: textParts.join("\n\n"),
    headers: track
      ? {
          "List-Unsubscribe": `<${SITE_URL}/api/m/u/${token}>, <mailto:${REPLY_ADDRESS}?subject=Unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : undefined,
  };
}

