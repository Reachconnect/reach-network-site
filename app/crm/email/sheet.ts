// Reads a spreadsheet in the browser: .csv, or .xlsx (Excel) without any extra libraries
export type Sheet = { name: string; rows: string[][] };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delim = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : text.split("\n")[0].includes("\t") && !text.split("\n")[0].includes(",") ? "\t" : ",";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some(Boolean));
}

// ---- A tiny .zip reader (an .xlsx file is a zip of XML files) ----
async function unzip(buf: ArrayBuffer): Promise<Map<string, string>> {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("That doesn't look like an Excel file.");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!/\.(xml|rels)$/.test(name)) continue;
    const lNameLen = v.getUint16(local + 26, true);
    const lExtraLen = v.getUint16(local + 28, true);
    const data = bytes.subarray(local + 30 + lNameLen + lExtraLen, local + 30 + lNameLen + lExtraLen + csize);
    if (method === 0) out.set(name, dec.decode(data));
    else if (method === 8) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inflate: any = new DecompressionStream("deflate-raw" as CompressionFormat);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream: any = (new Blob([data as unknown as BlobPart]).stream() as any).pipeThrough(inflate);
      out.set(name, await new Response(stream as ReadableStream).text());
    }
  }
  return out;
}

const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");
const colIndex = (ref: string) => {
  const letters = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export async function readXlsx(buf: ArrayBuffer): Promise<Sheet[]> {
  const files = await unzip(buf);
  const shared: string[] = [];
  const ss = files.get("xl/sharedStrings.xml");
  if (ss) {
    xml(ss)
      .querySelectorAll("si")
      .forEach((si) => shared.push(Array.from(si.getElementsByTagName("t")).map((t) => t.textContent || "").join("")));
  }
  const wb = xml(files.get("xl/workbook.xml") || "");
  const rels = xml(files.get("xl/_rels/workbook.xml.rels") || "");
  const target = new Map<string, string>();
  rels.querySelectorAll("Relationship").forEach((r) => target.set(r.getAttribute("Id") || "", r.getAttribute("Target") || ""));
  const sheets: Sheet[] = [];
  for (const s of Array.from(wb.getElementsByTagName("sheet"))) {
    const rid = s.getAttribute("r:id") || s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") || "";
    let t = target.get(rid) || "";
    t = t.startsWith("/") ? t.slice(1) : `xl/${t.replace(/^\.\//, "")}`;
    const doc = files.get(t);
    if (!doc) continue;
    const rows: string[][] = [];
    for (const r of Array.from(xml(doc).getElementsByTagName("row"))) {
      const row: string[] = [];
      for (const c of Array.from(r.getElementsByTagName("c"))) {
        const type = c.getAttribute("t");
        const ref = c.getAttribute("r");
        const idx = ref ? colIndex(ref) : row.length;
        let val = "";
        if (type === "s") val = shared[Number(c.getElementsByTagName("v")[0]?.textContent)] ?? "";
        else if (type === "inlineStr") val = Array.from(c.getElementsByTagName("t")).map((x) => x.textContent || "").join("");
        else val = c.getElementsByTagName("v")[0]?.textContent ?? "";
        while (row.length < idx) row.push("");
        row[idx] = val.trim();
      }
      if (row.some(Boolean)) rows.push(row);
    }
    sheets.push({ name: s.getAttribute("name") || `Sheet ${sheets.length + 1}`, rows });
  }
  return sheets;
}

export async function readSpreadsheet(file: File): Promise<Sheet[]> {
  if (/\.xlsx$/i.test(file.name)) return readXlsx(await file.arrayBuffer());
  if (/\.xls$/i.test(file.name)) throw new Error("That's an old Excel file (.xls). Open it in Excel and Save As .xlsx or .csv, then upload it again.");
  return [{ name: file.name, rows: parseCsv(await file.text()) }];
}

// Which column is which. Returns column numbers (or -1).
export const FIELDS = [
  { key: "email", label: "Email", tests: [/^e-?mail( address)?$/i, /e-?mail/i] },
  { key: "first_name", label: "First name", tests: [/^first[ _-]?name$/i, /^first$|forename|given/i] },
  { key: "last_name", label: "Last name", tests: [/^last[ _-]?name$/i, /surname|family/i] },
  { key: "full_name", label: "Full name (if no first name)", tests: [/^(full[ _-]?)?name$/i, /contact name|full name/i] },
  { key: "company", label: "Company", tests: [/^company( name)?$/i, /^(organi[sz]ation|business|employer|account)( name)?$/i, /company name/i] },
  { key: "job_title", label: "Job title", tests: [/^(job )?title$/i, /job title|position|role/i] },
  { key: "phone", label: "Phone", tests: [/^(phone|mobile|telephone|tel)( number)?$/i, /phone|mobile|tel/i] },
] as const;

export type FieldKey = (typeof FIELDS)[number]["key"];

export function guessColumns(header: string[]): Record<FieldKey, number> {
  const used = new Set<number>();
  const out = {} as Record<FieldKey, number>;
  for (const f of FIELDS) {
    out[f.key] = -1;
    for (const t of f.tests) {
      const i = header.findIndex((h, n) => !used.has(n) && t.test(h.trim()));
      if (i >= 0) {
        out[f.key] = i;
        used.add(i);
        break;
      }
    }
  }
  return out;
}

export function headerRow(rows: string[][]) {
  // The first row that has an email-ish heading, or else the first row
  const i = rows.findIndex((r) => r.some((c) => /e-?mail/i.test(c)));
  return Math.max(0, i);
}
