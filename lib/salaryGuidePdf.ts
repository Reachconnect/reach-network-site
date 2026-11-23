// Builds the branded salary guide PDF
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { GUIDE_YEAR, ONS_SOURCE, employerCostPerHour, type GuideRole, type OnsFigure } from "./salaryGuide";

export type CrmRate = { key: string; hourly: { low: number; mid: number; high: number; n: number } | null; annual: { low: number; mid: number; high: number; n: number } | null };

const W = 595.28;
const H = 841.89;
const M = 48;
const NAVY = rgb(15 / 255, 36 / 255, 56 / 255);
const NAVY_DEEP = rgb(10 / 255, 26 / 255, 41 / 255);
const ORANGE = rgb(247 / 255, 147 / 255, 30 / 255);
const GREY = rgb(100 / 255, 116 / 255, 139 / 255);
const LIGHT = rgb(241 / 255, 245 / 255, 249 / 255);
const LINE = rgb(226 / 255, 232 / 255, 240 / 255);
const WHITE = rgb(1, 1, 1);

type Fonts = { r: PDFFont; b: PDFFont };

const gbp = (n: number) => `£${n.toFixed(2)}`;
const gbp0 = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

// Helvetica can't draw some characters, so swap them for safe ones
const clean = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\x7E£·]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Shrink, then trim, text so it fits a width
function fit(s: string, font: PDFFont, size: number, width: number, min = 8) {
  let sz = size;
  let t = clean(s);
  while (sz > min && font.widthOfTextAtSize(t, sz) > width) sz -= 0.5;
  while (font.widthOfTextAtSize(t, sz) > width && t.length > 3) t = t.slice(0, -4) + "...";
  return { t, sz };
}

function text(p: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = NAVY) {
  p.drawText(clean(s), { x, y, font, size, color });
}

function para(p: PDFPage, s: string, x: number, y: number, width: number, font: PDFFont, size: number, color = NAVY, lh = 1.45) {
  const lines = wrap(s, font, size, width);
  lines.forEach((l, i) => p.drawText(l, { x, y: y - i * size * lh, font, size, color }));
  return y - lines.length * size * lh;
}

function logo(p: PDFPage, f: Fonts, x: number, y: number, light = true) {
  p.drawCircle({ x: x + 13, y: y + 6, size: 12, borderColor: ORANGE, borderWidth: 3 });
  p.drawCircle({ x: x + 13, y: y + 6, size: 4.5, color: ORANGE });
  text(p, "REACH", x + 33, y + 6, f.b, 15, light ? WHITE : NAVY);
  text(p, "NETWORK RECRUITMENT", x + 33, y - 4, f.b, 6.5, light ? rgb(0.75, 0.8, 0.85) : GREY);
}

function footer(p: PDFPage, f: Fonts, n: number) {
  p.drawRectangle({ x: 0, y: 0, width: W, height: 4, color: ORANGE });
  text(p, `Reach Network Recruitment  ·  reachnetworkrec.com  ·  0121 630 1643`, M, 20, f.r, 8, GREY);
  const t = `${n}`;
  text(p, t, W - M - f.r.widthOfTextAtSize(t, 8), 20, f.r, 8, GREY);
}

function header(p: PDFPage, f: Fonts, title: string, kicker: string) {
  p.drawRectangle({ x: 0, y: H - 118, width: W, height: 118, color: NAVY });
  p.drawRectangle({ x: 0, y: H - 122, width: W, height: 4, color: ORANGE });
  logo(p, f, M, H - 46);
  text(p, kicker.toUpperCase(), M, H - 80, f.b, 8.5, ORANGE);
  text(p, title, M, H - 102, f.b, 20, WHITE);
}

function range(o?: OnsFigure | null) {
  if (!o) return null;
  return { main: gbp(o.median), sub: o.p25 && o.p75 ? `${gbp(o.p25)} - ${gbp(o.p75)}` : "" };
}

export async function buildSalaryGuide(opts: { roles: GuideRole[]; crm: CrmRate[]; company?: string; name?: string; date?: Date }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Midlands pay rates ${GUIDE_YEAR} - Reach Network Recruitment`);
  doc.setAuthor("Reach Network Recruitment");
  doc.setSubject("Pay rates for drivers, warehouse, manufacturing and engineering roles");
  const f: Fonts = { r: await doc.embedFont(StandardFonts.Helvetica), b: await doc.embedFont(StandardFonts.HelveticaBold) };
  const date = (opts.date || new Date()).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  let pageNo = 1;

  // ---------- Cover ----------
  const c = doc.addPage([W, H]);
  c.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  c.drawCircle({ x: 60, y: H - 60, size: 260, color: rgb(0.32, 0.25, 0.17), opacity: 0.55 });
  c.drawCircle({ x: W - 40, y: 120, size: 180, color: NAVY_DEEP, opacity: 0.8 });
  logo(c, f, M, H - 70);
  text(c, "FREE GUIDE FOR EMPLOYERS", M, H - 300, f.b, 11, ORANGE);
  text(c, "Midlands pay rates", M, H - 345, f.b, 40, WHITE);
  text(c, GUIDE_YEAR, M, H - 392, f.b, 40, ORANGE);
  let y = para(c, "Typical hourly pay for drivers, warehouse, manufacturing and engineering roles, what a worker really costs you, and how to fill shifts faster.", M, H - 440, 380, f.r, 13, rgb(0.82, 0.86, 0.9), 1.5);
  if (opts.company || opts.name) {
    c.drawRectangle({ x: M, y: y - 62, width: 300, height: 46, color: rgb(1, 1, 1), opacity: 0.08 });
    text(c, "PREPARED FOR", M + 14, y - 32, f.b, 7.5, ORANGE);
    text(c, [opts.name, opts.company].filter(Boolean).join(", "), M + 14, y - 48, f.b, 11, WHITE);
  }
  text(c, date, M, 70, f.r, 10, rgb(0.7, 0.75, 0.8));
  text(c, "reachnetworkrec.com  ·  0121 630 1643", M, 54, f.b, 10, WHITE);
  c.drawRectangle({ x: 0, y: 0, width: W, height: 8, color: ORANGE });

  // ---------- Page 2: how to read + the legal floor ----------
  pageNo++;
  const p2 = doc.addPage([W, H]);
  header(p2, f, "How to use this guide", "Before you start");
  y = H - 160;
  y = para(p2, "For each role we show two kinds of figure, so you can see both the official picture and what's happening right now:", M, y, W - 2 * M, f.r, 11, NAVY);
  y -= 14;
  const boxes = [
    { t: "Official figures (ONS)", s: "Median hourly pay and the middle half of earners (25th to 75th percentile), from the Office for National Statistics. Reliable and broad, but measured each April and covering all employees in that occupation." },
    { t: "Reach jobs", s: "The range on roles we've recruited for recently. More current and more specific, shown only where we have at least 3 jobs for that role." },
  ];
  for (const b of boxes) {
    const lines = wrap(b.s, f.r, 10, W - 2 * M - 36);
    const h = 34 + lines.length * 14.5;
    p2.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: LIGHT });
    p2.drawRectangle({ x: M, y: y - h, width: 4, height: h, color: ORANGE });
    text(p2, b.t, M + 18, y - 20, f.b, 11.5, NAVY);
    lines.forEach((l, i) => p2.drawText(l, { x: M + 18, y: y - 38 - i * 14.5, font: f.r, size: 10, color: GREY }));
    y -= h + 14;
  }
  y -= 10;
  text(p2, "The numbers every employer needs for 2026/27", M, y, f.b, 14, NAVY);
  y -= 22;
  const facts = [
    ["National Living Wage (21 and over)", "£12.71 an hour from 1 April 2026"],
    ["18 to 20 year olds", "£10.85 an hour"],
    ["Employer's National Insurance", "15% on earnings above £96 a week"],
    ["Holiday pay for irregular hours", "12.07% of pay, or 5.6 weeks a year"],
    ["Auto-enrolment pension", "At least 3% employer on earnings between £120 and £967 a week"],
  ];
  for (const [a, b] of facts) {
    p2.drawLine({ start: { x: M, y: y + 12 }, end: { x: W - M, y: y + 12 }, thickness: 0.6, color: LINE });
    text(p2, a, M, y - 2, f.b, 10, NAVY);
    text(p2, b, M + 230, y - 2, f.r, 10, GREY);
    y -= 26;
  }
  y -= 10;
  para(p2, "Paying at the top of the local range usually means faster fills, fewer no-shows and better retention, especially for nights, weekends and short notice.", M, y, W - 2 * M, f.r, 10.5, NAVY);
  footer(p2, f, pageNo);

  // ---------- Sector pages ----------
  const sectors = ["Driving", "Warehouse", "Manufacturing", "Engineering"] as const;
  const col = { role: M, wm: M + 178, em: M + 268, reach: M + 358, w: W - 2 * M };
  for (const s of sectors) {
    const rows = opts.roles.filter((r) => r.sector === s);
    if (!rows.length) continue;
    pageNo++;
    const p = doc.addPage([W, H]);
    header(p, f, `${s} pay rates`, `Hourly pay · ${GUIDE_YEAR}`);
    y = H - 158;
    p.drawRectangle({ x: M, y: y - 8, width: col.w, height: 26, color: NAVY });
    text(p, "ROLE", col.role + 10, y + 1, f.b, 7.5, WHITE);
    text(p, "WEST MIDLANDS", col.wm, y + 1, f.b, 7.5, WHITE);
    text(p, "EAST MIDLANDS", col.em, y + 1, f.b, 7.5, WHITE);
    text(p, "REACH JOBS", col.reach, y + 1, f.b, 7.5, ORANGE);
    y -= 30;
    for (const r of rows) {
      const crm = opts.crm.find((x) => x.key === r.key)?.hourly || null;
      const wm = range(r.ons?.westMidlands);
      const em = range(r.ons?.eastMidlands);
      const commentLines = r.comment ? wrap(`What we're seeing: ${r.comment}`, f.r, 8.5, col.w - 20) : [];
      const h = 46 + commentLines.length * 12;
      p.drawRectangle({ x: M, y: y - h + 14, width: col.w, height: h, color: rows.indexOf(r) % 2 ? WHITE : LIGHT });
      const lab = fit(r.label, f.b, 10, col.wm - col.role - 18, 8);
      text(p, lab.t, col.role + 10, y, f.b, lab.sz, NAVY);
      const occ = fit(`ONS: ${r.occupation}`, f.r, 7, col.wm - col.role - 18, 6);
      text(p, occ.t, col.role + 10, y - 13, f.r, occ.sz, GREY);
      const cell = (v: { main: string; sub: string } | null, x: number) => {
        if (!v) return text(p, "-", x, y, f.r, 10, GREY);
        text(p, v.main, x, y, f.b, 11, NAVY);
        if (v.sub) text(p, v.sub, x, y - 13, f.r, 7.5, GREY);
      };
      cell(wm, col.wm);
      cell(em, col.em);
      if (crm) {
        text(p, `${gbp(crm.low)} - ${gbp(crm.high)}`, col.reach, y, f.b, 10.5, ORANGE);
        text(p, `typical ${gbp(crm.mid)} · ${crm.n} jobs`, col.reach, y - 13, f.r, 7.5, GREY);
      } else {
        text(p, "Ask us", col.reach, y, f.b, 10, ORANGE);
        text(p, "for current local rates", col.reach, y - 13, f.r, 7.5, GREY);
      }
      commentLines.forEach((l, i) => p.drawText(l, { x: col.role + 10, y: y - 30 - i * 12, font: f.r, size: 8.5, color: NAVY }));
      y -= h + 2;
    }
    y -= 14;
    para(p, "ONS figures are median hourly pay excluding overtime, with the middle half of earners (25th to 75th percentile) underneath. Dashes mean the ONS doesn't publish a reliable figure for that area.", M, y, col.w, f.r, 8, GREY);
    // CTA box
    p.drawRectangle({ x: M, y: 70, width: col.w, height: 74, color: NAVY });
    text(p, `Need ${s.toLowerCase()} staff?`, M + 20, 118, f.b, 14, WHITE);
    text(p, "Checked people, matched to your site and shifts. Send a request in two minutes.", M + 20, 100, f.r, 9.5, rgb(0.8, 0.84, 0.88));
    text(p, "reachnetworkrec.com/i-need-staff  ·  0121 630 1643", M + 20, 82, f.b, 9.5, ORANGE);
    footer(p, f, pageNo);
  }

  // ---------- True cost page ----------
  pageNo++;
  const tc = doc.addPage([W, H]);
  header(tc, f, "What a worker really costs", "Employing directly vs using Reach");
  y = H - 160;
  y = para(tc, "The hourly rate is only part of the cost. This is what one hour costs you if you employ someone directly for 40 hours a week, before training, sick pay, PPE or recruitment time.", M, y, W - 2 * M, f.r, 10.5, NAVY);
  y -= 18;
  tc.drawRectangle({ x: M, y: y - 8, width: W - 2 * M, height: 26, color: NAVY });
  const tx = [M + 10, M + 120, M + 230, M + 340];
  ["PAY RATE", "REAL COST / HOUR", "COST / WEEK", "COST / YEAR"].forEach((h, i) => text(tc, h, tx[i], y + 1, f.b, 7.5, i === 1 ? ORANGE : WHITE));
  y -= 30;
  [12.71, 13.5, 14.5, 16, 18, 20].forEach((rate, i) => {
    const per = employerCostPerHour(rate);
    tc.drawRectangle({ x: M, y: y - 10, width: W - 2 * M, height: 28, color: i % 2 ? WHITE : LIGHT });
    text(tc, gbp(rate), tx[0], y, f.b, 11, NAVY);
    text(tc, gbp(per), tx[1], y, f.b, 11, ORANGE);
    text(tc, gbp0(per * 40), tx[2], y, f.r, 10.5, NAVY);
    text(tc, gbp0(per * 40 * 52), tx[3], y, f.r, 10.5, NAVY);
    y -= 28;
  });
  y -= 12;
  y = para(tc, "Includes holiday pay at 12.07%, employer's National Insurance at 15% above £96 a week, and a 3% pension on qualifying earnings. It doesn't include the Apprenticeship Levy or Employment Allowance, which depend on your business.", M, y, W - 2 * M, f.r, 8.5, GREY);
  y -= 26;
  text(tc, "With Reach", M, y, f.b, 15, NAVY);
  y -= 20;
  const withUs = [
    "We employ and pay the worker: payroll, holiday pay, NI and pension are all covered in one hourly charge rate.",
    "One clear weekly invoice, based on the hours you approve.",
    "Every worker checked first: ID, right to work, history, licences and tickets.",
    "See who's on site, approve timesheets and track costs by site, live, in Reach Connect.",
  ];
  for (const w of withUs) {
    tc.drawCircle({ x: M + 6, y: y + 3.5, size: 3.5, color: ORANGE });
    y = para(tc, w, M + 18, y, W - 2 * M - 18, f.r, 10.5, NAVY) - 6;
  }
  text(tc, "Try the live calculator: reachnetworkrec.com/pay-rates", M, y - 10, f.b, 10, ORANGE);
  footer(tc, f, pageNo);

  // ---------- Back page ----------
  pageNo++;
  const bk = doc.addPage([W, H]);
  bk.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  bk.drawCircle({ x: W - 60, y: H - 80, size: 240, color: rgb(0.32, 0.25, 0.17), opacity: 0.5 });
  logo(bk, f, M, H - 70);
  text(bk, "Need staff?", M, H - 330, f.b, 38, WHITE);
  text(bk, "Let's talk.", M, H - 376, f.b, 38, ORANGE);
  y = para(bk, "Specialist recruitment for drivers, warehouse, manufacturing and engineering. Temporary, temp-to-perm and permanent, from our office in Bromsgrove.", M, H - 420, 400, f.r, 12, rgb(0.82, 0.86, 0.9), 1.5);
  const contacts = [
    ["Call", "0121 630 1643"],
    ["Email", "info@reachnetworkrec.com"],
    ["Request staff", "reachnetworkrec.com/i-need-staff"],
    ["Visit", "132a High Street, Bromsgrove, B61 8ES"],
  ];
  y -= 30;
  for (const [a, b] of contacts) {
    text(bk, a.toUpperCase(), M, y, f.b, 8, ORANGE);
    text(bk, b, M, y - 16, f.b, 13, WHITE);
    y -= 44;
  }
  const after = para(bk, `Sources: ${ONS_SOURCE}; GOV.UK rates and thresholds for employers 2026 to 2027; Reach Network Recruitment job data.`, M, 72, W - 2 * M, f.r, 7, rgb(0.6, 0.66, 0.72));
  text(bk, "General guidance only. Rates vary with shift pattern, location, experience and demand.", M, after - 2, f.r, 7, rgb(0.6, 0.66, 0.72));
  bk.drawRectangle({ x: 0, y: 0, width: W, height: 8, color: ORANGE });

  return doc.save();
}
