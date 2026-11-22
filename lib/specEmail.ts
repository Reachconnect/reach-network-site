// The email that goes out with a spec. Safe to use in the browser and on the server.
// The template uses {name}, {company} and {link}, filled in for each company when it's sent.
import type { SpecContent } from "./specs";

export function specEmailTemplate(people: SpecContent[], role: string, hasVideo: boolean) {
  const single = people.length === 1;
  const c = people[0];
  const first = (c?.display_name || "").split(" ")[0];
  const forRole = role ? ` (${role})` : "";

  const lines = single
    ? [
        "Hi {name},",
        "",
        `I'm Darren from Reach Network Recruitment. I've got a candidate who I think could be a great fit for {company}${forRole}.`,
        "",
        `${c.display_name}: ${c.headline}`,
        ...c.checklist.slice(0, 4).map((x) => `✓ ${x}`),
        "",
        c.why,
        "",
        hasVideo
          ? `I've recorded a short video about ${first}. You can watch it, see the full profile and ask us to call you in one tap here:`
          : `You can see ${first}'s full profile here, and ask us to call you in one tap:`,
      ]
    : [
        "Hi {name},",
        "",
        `I'm Darren from Reach Network Recruitment. I've put together ${people.length} candidates who I think could suit {company}${forRole}:`,
        "",
        ...people.map((p) => `• ${p.display_name}: ${p.headline}${p.area ? `, ${p.area}` : ""}`),
        "",
        hasVideo
          ? "I've recorded a short video about them. You can watch it, see each of them in full, tick the ones you like and ask us to call you here:"
          : "You can see each of them in full here, tick the ones you like, and ask us to call you in one tap:",
      ];

  return {
    subject: single ? `${c.headline}${c.area ? `, ${c.area}` : ""}` : `${people.length} candidates for {company}${role ? `: ${role}` : ""}`,
    text: [...lines, "{link}", "", "Happy to have a quick chat if you'd like to know more.", "", "Kind regards,", "Darren Rowell", "Reach Network Recruitment"].join("\n"),
  };
}

export const OPT_OUT = "If you'd rather not hear from us, just reply and let me know and I won't email again.";

// Fills the template for one company. If {link} was deleted, the link goes at the end.
export function fillEmail(template: { subject: string; text: string }, vars: { name: string | null; company: string; link: string }) {
  const first = (vars.name || "").trim().split(/\s+/)[0] || "there";
  const fill = (t: string) => t.replace(/\{name\}/g, first).replace(/\{company\}/g, vars.company);
  let text = fill(template.text);
  if (!text.includes("{link}")) text += "\n\n{link}";
  return { subject: fill(template.subject).replace(/\{link\}/g, ""), text };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain text version and HTML version, with the link as an orange button
export function renderEmail(text: string, link: string, buttonLabel: string) {
  const plain = `${text.replace(/\{link\}/g, link)}\n\n${OPT_OUT}`;
  const html = text.split("\n").map((line) => {
    if (line.trim() === "{link}") {
      return `<p style="margin:18px 0"><a href="${link}" style="display:inline-block;background:#F7931E;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">${esc(buttonLabel)}</a></p>`;
    }
    if (!line.trim()) return `<div style="height:10px"></div>`;
    return `<div style="font-size:15px;line-height:1.55;color:#0F2438">${esc(line).replace(/\{link\}/g, `<a href="${link}">${link}</a>`)}</div>`;
  });
  html.push(`<div style="height:18px"></div><div style="font-size:12px;line-height:1.5;color:#64748b">${esc(OPT_OUT)}</div>`);
  return { text: plain, html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;color:#0F2438">${html.join("")}</div>` };
}
