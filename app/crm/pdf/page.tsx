"use client";

// PDF editor: click any text to change it, or click anywhere to add new text, then download the PDF.
// Changed text is covered over and rewritten in the nearest standard font, so small edits look natural.
import { useEffect, useRef, useState } from "react";

type Item = { idx: number; str: string; left: number; top: number; width: number; height: number; x: number; y: number; size: number; pdfWidth: number; serif: boolean; bold: boolean; bg: string; fg: string };
type PageView = { num: number; width: number; height: number; image: string; items: Item[]; toPdf: (x: number, y: number) => [number, number]; scale: number };
type Edit = { page: number; idx: number; text: string };
type Added = { id: number; page: number; left: number; top: number; text: string; size: number; bold: boolean; color: string };

const SCALE = 1.5;
let nextId = 1;

// Characters the standard PDF fonts can write
const SAFE = /[^\x20-\x7E -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g;
const clean = (s: string) => s.replace(/\t/g, " ").replace(SAFE, "?");

function hex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function rgb01(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
}

// The background colour round a piece of text, and the colour of the text itself
function sampleColours(ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number) {
  const x0 = Math.max(0, Math.floor(left) - 2);
  const y0 = Math.max(0, Math.floor(top) - 2);
  const x1 = Math.min(ctx.canvas.width - 1, Math.ceil(left + w) + 2);
  const y1 = Math.min(ctx.canvas.height - 1, Math.ceil(top + h) + 2);
  if (x1 <= x0 || y1 <= y0) return { bg: "#ffffff", fg: "#000000" };
  const data = ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  const W = data.width;
  const H = data.height;
  const px = (x: number, y: number) => {
    const i = (y * W + x) * 4;
    return [data.data[i], data.data[i + 1], data.data[i + 2]];
  };
  const counts = new Map<string, { n: number; c: number[] }>();
  const edge = (x: number, y: number) => {
    const c = px(x, y);
    const k = c.map((v) => v >> 4).join(",");
    const e = counts.get(k) || { n: 0, c };
    e.n++;
    counts.set(k, e);
  };
  for (let x = 0; x < W; x++) {
    edge(x, 0);
    edge(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    edge(0, y);
    edge(W - 1, y);
  }
  const bgC = Array.from(counts.values()).sort((a, b) => b.n - a.n)[0]?.c || [255, 255, 255];
  let best = 0;
  let fgC = [0, 0, 0];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = px(x, y);
      const d = Math.abs(c[0] - bgC[0]) + Math.abs(c[1] - bgC[1]) + Math.abs(c[2] - bgC[2]);
      if (d > best) {
        best = d;
        fgC = c;
      }
    }
  }
  return { bg: hex(bgC[0], bgC[1], bgC[2]), fg: best > 60 ? hex(fgC[0], fgC[1], fgC[2]) : "#000000" };
}

export default function PdfEditorPage() {
  const [fileName, setFileName] = useState("");
  const original = useRef<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageView[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [edits, setEdits] = useState<Edit[]>([]);
  const [added, setAdded] = useState<Added[]>([]);
  const [editing, setEditing] = useState<{ page: number; idx: number; value: string } | null>(null);
  const [mode, setMode] = useState<"edit" | "add">("edit");
  const [newSize, setNewSize] = useState(11);
  const [newBold, setNewBold] = useState(false);
  const [newColor, setNewColor] = useState("#000000");
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);

  async function open(file: File) {
    setError(null);
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return setError("Choose a PDF file.");
    setLoading("Opening…");
    setPages([]);
    setEdits([]);
    setAdded([]);
    setEditing(null);
    try {
      const bytes = await file.arrayBuffer();
      original.current = bytes.slice(0);
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      if (pdf.numPages > 60) throw new Error("That PDF has more than 60 pages. Split it first and edit the pages you need.");
      const out: PageView[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        setLoading(`Reading page ${n} of ${pdf.numPages}…`);
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: SCALE });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        const text = await page.getTextContent();
        const items: Item[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (text.items as any[]).forEach((it, idx) => {
          if (!("str" in it) || !it.str.trim()) return;
          const [a, b, c, d, e, f] = it.transform as number[];
          if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || a <= 0) return; // skip rotated or mirrored text
          const tx = pdfjs.Util.transform(viewport.transform, it.transform);
          const height = Math.hypot(tx[2], tx[3]);
          const width = it.width * SCALE;
          const left = tx[4];
          const top = tx[5] - height;
          let fontName = "";
          try {
            fontName = (page.commonObjs.get(it.fontName) as { name?: string })?.name || "";
          } catch {
            fontName = "";
          }
          const family = (text.styles as Record<string, { fontFamily?: string }>)[it.fontName]?.fontFamily || "";
          const serif = /times|serif|georgia|garamond|cambria|book/i.test(fontName) || (/serif/i.test(family) && !/sans/i.test(family));
          const { bg, fg } = sampleColours(ctx, left, top, width, height * 1.2);
          items.push({ idx, str: it.str, left, top, width, height, x: e, y: f, size: Math.hypot(c, d) || Math.abs(d) || Math.abs(a), pdfWidth: it.width, serif, bold: /bold|black|heavy|semibold|demi/i.test(fontName), bg, fg });
        });
        out.push({
          num: n,
          width: canvas.width,
          height: canvas.height,
          image: canvas.toDataURL("image/png"),
          items,
          toPdf: (x, y) => viewport.convertToPdfPoint(x, y) as [number, number],
          scale: SCALE,
        });
      }
      setPages(out);
      setFileName(file.name);
      if (!out.some((p) => p.items.length)) setError("This PDF has no editable text (it's probably a scan or a picture). You can still add new text on top.");
    } catch (e) {
      setError(`Couldn't open that PDF: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  const editFor = (page: number, idx: number) => edits.find((e) => e.page === page && e.idx === idx);

  function commit() {
    if (!editing) return;
    const page = pages.find((p) => p.num === editing.page);
    const item = page?.items.find((i) => i.idx === editing.idx);
    const value = editing.value;
    setEdits((list) => {
      const rest = list.filter((e) => !(e.page === editing.page && e.idx === editing.idx));
      return item && value === item.str ? rest : [...rest, { page: editing.page, idx: editing.idx, text: value }];
    });
    setEditing(null);
  }

  function clickPage(p: PageView, e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "add" || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const k = p.width / rect.width;
    const left = (e.clientX - rect.left) * k;
    const top = (e.clientY - rect.top) * k - newSize * SCALE * 0.6;
    setAdded((a) => [...a, { id: nextId++, page: p.num, left, top, text: "", size: newSize, bold: newBold, color: newColor }]);
    setMode("edit");
  }

  // Dragging added text around
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const el = document.getElementById(`page-${added.find((a) => a.id === d.id)?.page}`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const p = pages.find((x) => `page-${x.num}` === el.id)!;
      const k = p.width / rect.width;
      setAdded((list) => list.map((a) => (a.id === d.id ? { ...a, left: (e.clientX - rect.left) * k - d.dx, top: (e.clientY - rect.top) * k - d.dy } : a)));
    };
    const up = () => (drag.current = null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [added, pages]);

  async function download() {
    if (!original.current) return;
    setLoading("Making your PDF…");
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const doc = await PDFDocument.load(original.current.slice(0), { ignoreEncryption: true });
      const fonts = {
        sans: await doc.embedFont(StandardFonts.Helvetica),
        sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
        serif: await doc.embedFont(StandardFonts.TimesRoman),
        serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
      };
      const colour = (h: string) => rgb(...rgb01(h));
      for (const ed of edits) {
        const p = pages.find((x) => x.num === ed.page);
        const it = p?.items.find((i) => i.idx === ed.idx);
        if (!p || !it) continue;
        const page = doc.getPage(ed.page - 1);
        const font = it.serif ? (it.bold ? fonts.serifBold : fonts.serif) : it.bold ? fonts.sansBold : fonts.sans;
        const text = clean(ed.text);
        const newWidth = text ? font.widthOfTextAtSize(text, it.size) : 0;
        page.drawRectangle({ x: it.x - 1, y: it.y - it.size * 0.28, width: Math.max(it.pdfWidth, newWidth) + 2, height: it.size * 1.25, color: colour(it.bg) });
        if (text) page.drawText(text, { x: it.x, y: it.y, size: it.size, font, color: colour(it.fg) });
      }
      for (const a of added) {
        const text = clean(a.text.trim());
        if (!text) continue;
        const p = pages.find((x) => x.num === a.page);
        if (!p) continue;
        const page = doc.getPage(a.page - 1);
        const [x, y] = p.toPdf(a.left + 4, a.top + 4 + a.size * SCALE * 0.82);
        const font = a.bold ? fonts.sansBold : fonts.sans;
        text.split("\n").forEach((line, i) => page.drawText(line, { x, y: y - i * a.size * 1.25, size: a.size, font, color: colour(a.color) }));
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName.replace(/\.pdf$/i, "")} (edited).pdf`;
      link.click();
    } catch (e) {
      setError(`Couldn't make the PDF: ${(e as Error).message}`);
    }
    setLoading(null);
  }

  const changes = edits.length + added.filter((a) => a.text.trim()).length;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3447]">PDF editor</h1>
          <p className="text-sm text-slate-500">Click any text to change it, or add new text anywhere. Then download your PDF.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold ${pages.length ? "border border-slate-300 bg-white text-[#1F3447]" : "bg-[#F7931E] text-white"}`}>
            {pages.length ? "Open another PDF" : "Open a PDF"}
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
          </label>
          {pages.length > 0 && (
            <button onClick={download} disabled={!!loading} className="rounded-lg bg-[#F7931E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              Download PDF{changes ? ` (${changes} change${changes > 1 ? "s" : ""})` : ""}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
      {loading && <p className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{loading}</p>}

      {!pages.length && !loading && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center hover:border-[#F7931E]">
          <span className="text-lg font-semibold text-[#1F3447]">Drop a PDF here, or click to choose one</span>
          <span className="mt-1 text-sm text-slate-500">It stays on your computer: nothing is uploaded.</span>
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
        </label>
      )}

      {pages.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="space-y-6">
            {pages.map((p) => (
              <div key={p.num}>
                <p className="mb-1 text-xs text-slate-400">Page {p.num}</p>
                <div
                  id={`page-${p.num}`}
                  onClick={(e) => clickPage(p, e)}
                  className={`relative mx-auto bg-white shadow-md ${mode === "add" ? "cursor-crosshair" : ""}`}
                  style={{ width: "100%", maxWidth: p.width, aspectRatio: `${p.width} / ${p.height}`, containerType: "inline-size" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`Page ${p.num}`} className="pointer-events-none absolute inset-0 h-full w-full select-none" draggable={false} />

                  {/* Existing text you can click */}
                  {p.items.map((it) => {
                    const ed = editFor(p.num, it.idx);
                    const isEditing = editing?.page === p.num && editing.idx === it.idx;
                    const pos = { left: `${(it.left / p.width) * 100}%`, top: `${(it.top / p.height) * 100}%`, height: `${((it.height * 1.2) / p.height) * 100}%` };
                    const fontSize = `calc(${(it.height / p.width) * 100}cqw * 0.92)`;
                    if (isEditing && editing) {
                      return (
                        <input
                          key={it.idx}
                          autoFocus
                          value={editing.value}
                          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                          onBlur={commit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="absolute z-20 rounded-sm px-0 outline outline-2 outline-[#F7931E]"
                          style={{ ...pos, minWidth: `${(it.width / p.width) * 100}%`, width: `${Math.max(it.width, editing.value.length * it.height * 0.55) / p.width * 100}%`, fontSize, background: it.bg, color: it.fg, fontFamily: it.serif ? "Times New Roman, serif" : "Helvetica, Arial, sans-serif", fontWeight: it.bold ? 700 : 400, lineHeight: 1 }}
                        />
                      );
                    }
                    return (
                      <button
                        key={it.idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode === "add") return;
                          setEditing({ page: p.num, idx: it.idx, value: ed ? ed.text : it.str });
                        }}
                        title="Click to change this text"
                        className={`absolute whitespace-pre text-left ${ed ? "z-10" : "hover:outline hover:outline-1 hover:outline-dashed hover:outline-[#F7931E]"}`}
                        style={{
                          ...pos,
                          width: ed ? "auto" : `${(it.width / p.width) * 100}%`,
                          minWidth: `${(it.width / p.width) * 100}%`,
                          fontSize,
                          lineHeight: 1,
                          background: ed ? it.bg : "transparent",
                          color: ed ? it.fg : "transparent",
                          fontFamily: it.serif ? "Times New Roman, serif" : "Helvetica, Arial, sans-serif",
                          fontWeight: it.bold ? 700 : 400,
                        }}
                      >
                        {ed ? ed.text || " " : it.str}
                      </button>
                    );
                  })}

                  {/* Text you've added */}
                  {added
                    .filter((a) => a.page === p.num)
                    .map((a) => (
                      <div key={a.id} className="group absolute z-20" style={{ left: `${(a.left / p.width) * 100}%`, top: `${(a.top / p.height) * 100}%` }}>
                        <div className="absolute -top-6 left-0 hidden gap-1 group-focus-within:flex group-hover:flex">
                          <span
                            onPointerDown={(e) => {
                              const el = document.getElementById(`page-${p.num}`)!.getBoundingClientRect();
                              const k = p.width / el.width;
                              drag.current = { id: a.id, dx: (e.clientX - el.left) * k - a.left, dy: (e.clientY - el.top) * k - a.top };
                            }}
                            className="cursor-move rounded bg-[#1F3447] px-1.5 text-xs text-white"
                          >
                            ✥ move
                          </span>
                          <button onClick={() => setAdded((l) => l.filter((x) => x.id !== a.id))} className="rounded bg-red-600 px-1.5 text-xs text-white">
                            ✕
                          </button>
                        </div>
                        <textarea
                          autoFocus={!a.text}
                          value={a.text}
                          rows={Math.max(1, a.text.split("\n").length)}
                          placeholder="Type here"
                          onChange={(e) => setAdded((l) => l.map((x) => (x.id === a.id ? { ...x, text: e.target.value } : x)))}
                          className="resize-none overflow-hidden rounded-sm border border-dashed border-[#F7931E] bg-transparent p-1 outline-none focus:bg-white/70"
                          style={{
                            fontSize: `calc(${((a.size * SCALE) / p.width) * 100}cqw)`,
                            fontWeight: a.bold ? 700 : 400,
                            color: a.color,
                            fontFamily: "Helvetica, Arial, sans-serif",
                            lineHeight: 1.25,
                            width: `${Math.max(8, ...a.text.split("\n").map((l) => l.length + 2))}ch`,
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold text-slate-800">Add new text</p>
              <div className="flex items-center gap-2">
                <select className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" value={newSize} onChange={(e) => setNewSize(Number(e.target.value))}>
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36].map((s) => (
                    <option key={s} value={s}>
                      {s}pt
                    </option>
                  ))}
                </select>
                <button onClick={() => setNewBold(!newBold)} className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${newBold ? "border-[#F7931E] bg-orange-50" : "border-slate-200"}`}>
                  B
                </button>
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-10 rounded border border-slate-200" aria-label="Text colour" />
              </div>
              <button
                onClick={() => setMode(mode === "add" ? "edit" : "add")}
                className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold ${mode === "add" ? "bg-[#1F3447] text-white" : "bg-[#F7931E] text-white"}`}
              >
                {mode === "add" ? "Now click on the page… (cancel)" : "+ Add text"}
              </button>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-bold text-slate-800">Your changes ({changes})</p>
              {!changes ? (
                <p className="text-xs text-slate-500">Click any text on the page to change it. Press Enter when you&apos;re done, or Esc to cancel. Delete all the words to remove a line.</p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {edits.map((e) => {
                    const it = pages.find((p) => p.num === e.page)?.items.find((i) => i.idx === e.idx);
                    return (
                      <li key={`${e.page}-${e.idx}`} className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="text-slate-400">p{e.page}:</span> <s className="text-slate-400">{it?.str}</s> → <b>{e.text || "(removed)"}</b>
                        </span>
                        <button onClick={() => setEdits((l) => l.filter((x) => x !== e))} className="flex-none text-slate-400 hover:text-red-600" title="Put it back">
                          ↺
                        </button>
                      </li>
                    );
                  })}
                  {added
                    .filter((a) => a.text.trim())
                    .map((a) => (
                      <li key={a.id} className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="text-slate-400">p{a.page}:</span> added <b>{a.text.slice(0, 40)}</b>
                        </span>
                        <button onClick={() => setAdded((l) => l.filter((x) => x.id !== a.id))} className="flex-none text-slate-400 hover:text-red-600">
                          ✕
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Changed text uses the closest standard font (Helvetica or Times), so it may look very slightly different. Scanned PDFs have no text to click, but you can still add text on top.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
