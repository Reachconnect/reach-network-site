// Spam filter for the public website forms.
// Spam is accepted quietly (so bots don't learn), but nothing is saved, emailed or alerted.

const VOWELS = /[aeiouy]/i;

// e.g. "WBtOfJrknkgACHygyHDr": lots of switching between capitals and small letters
function caseFlips(w: string) {
  let flips = 0;
  for (let i = 1; i < w.length; i++) {
    const a = w[i - 1];
    const b = w[i];
    if (/[a-z]/.test(a) && /[A-Z]/.test(b)) flips++;
  }
  return flips;
}

// e.g. "Kewjfnswuw", "Rkuvzks": long runs of consonants
function longestConsonantRun(w: string) {
  let run = 0;
  let max = 0;
  for (const ch of w.toLowerCase()) {
    if (/[a-z]/.test(ch) && !VOWELS.test(ch)) {
      run++;
      max = Math.max(max, run);
    } else run = 0;
  }
  return max;
}

export function looksLikeGibberish(text: string) {
  let strong = 0;
  let weak = 0;
  for (const w of String(text || "").split(/[^A-Za-zÀ-ÿ]+/).filter((x) => x.length >= 6)) {
    // Random strings switch between capitals and small letters (McDonald, DeVries only switch once)
    if (caseFlips(w) >= 2) strong++;
    const run = longestConsonantRun(w);
    if (run >= 6) strong++;
    else if (run >= 5) weak++;
  }
  // Real words like "strengths" have one odd run; random strings have lots
  return strong >= 1 || weak >= 3;
}

export function looksLikeUkPhone(phone: string) {
  const p = String(phone || "").replace(/[\s()-]/g, "");
  if (!/^\+?\d{9,15}$/.test(p)) return false;
  if (p.startsWith("0") || p.startsWith("+") || p.startsWith("44")) return true;
  // UK numbers typed without the leading 0, e.g. 7700 900123 or 121 630 1643
  return p.length === 10 && /^[123578]/.test(p);
}

type Check = {
  body: Record<string, unknown>;
  text: unknown[]; // names, company, notes etc
  phone?: unknown;
  place?: unknown; // a town or postcode field
};

// Returns why it looks like spam, or null if it looks genuine
export function spamReason(c: Check): string | null {
  const b = c.body || {};
  // Hidden field only bots fill in
  for (const k of ["website", "url", "company_url", "hp"]) if (typeof b[k] === "string" && (b[k] as string).trim()) return "honeypot";
  // Filled in faster than a person could
  const t = Number(b._t);
  if (t && t > 0 && t < 2500) return "too fast";
  const text = c.text.map((x) => String(x ?? "")).join(" ");
  if (looksLikeGibberish(text)) return "gibberish";
  if (c.phone !== undefined && String(c.phone || "").trim() && !looksLikeUkPhone(String(c.phone))) return "bad phone";
  if (c.place !== undefined) {
    const p = String(c.place || "").trim();
    if (p && /^\d+$/.test(p)) return "bad location";
  }
  if (/https?:\/\/|www\.|\[url|<a\s/i.test(text) && (text.match(/https?:\/\//g) || []).length >= 2) return "links";
  return null;
}

export function logSpam(form: string, reason: string, sample: unknown) {
  console.warn(`Spam blocked on ${form} (${reason}):`, JSON.stringify(sample).slice(0, 300));
}
