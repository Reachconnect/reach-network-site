"use client";

// Signing, step by step: read it, confirm your email with a code, type or draw your signature, done.
import { useEffect, useRef, useState } from "react";

const NAVY = "#0F2438";
const ORANGE = "#F7931E";

async function call(token: string, body: object) {
  const res = await fetch(`/api/s/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

function PdfPages({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        const pdf = await pdfjs.getDocument({ url }).promise;
        for (let n = 1; n <= pdf.numPages && !cancelled; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.6 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mb-3 w-full rounded border border-slate-200 bg-white shadow-sm";
          await page.render({ canvasContext: canvas.getContext("2d")!, canvas, viewport }).promise;
          box.current?.appendChild(canvas);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);
  return (
    <div>
      <div ref={box} />
      {error && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          The document couldn&apos;t be shown here. <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">Open it in a new tab</a> to read it.
        </p>
      )}
    </div>
  );
}

function DrawPad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const drawn = useRef(false);

  useEffect(() => {
    const c = ref.current!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = NAVY;
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function exportImage() {
    const c = ref.current!;
    // Trim to a tidy white-background image
    const out = document.createElement("canvas");
    out.width = 600;
    out.height = 160;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(c, 0, 0, out.width, out.height);
    onChange(out.toDataURL("image/png"));
  }

  return (
    <div>
      <canvas
        ref={ref}
        className="h-40 w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = e.currentTarget.getContext("2d")!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          drawn.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (drawn.current) exportImage();
        }}
      />
      <button
        type="button"
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          drawn.current = false;
          onChange(null);
        }}
        className="mt-1 text-xs text-slate-500 underline"
      >
        Clear
      </button>
    </div>
  );
}

export default function SignClient(p: {
  token: string;
  title: string;
  docId: string;
  companyName: string | null;
  html: string | null;
  pdfUrl: string | null;
  status: string;
  signerName: string;
  signerTitle: string | null;
  email: string;
  signedAt: string | null;
  declined: boolean;
  verified: boolean;
  senderName: string | null;
  senderSigned: boolean;
  message: string | null;
}) {
  const [stage, setStage] = useState<"read" | "done" | "declined">(p.signedAt || p.status === "completed" ? "done" : p.declined || p.status === "declined" ? "declined" : "read");
  const [completed, setCompleted] = useState(p.status === "completed");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(p.verified);
  const [code, setCode] = useState("");
  const [name, setName] = useState(p.signerName);
  const [jobTitle, setJobTitle] = useState(p.signerTitle || "");
  const [mode, setMode] = useState<"typed" | "drawn">("typed");
  const [drawing, setDrawing] = useState<string | null>(null);
  const [agree, setAgree] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signRef = useRef<HTMLDivElement>(null);
  const sender = p.senderName || "Darren Rowell";

  useEffect(() => {
    if (stage === "read" && p.status === "sent") call(p.token, { action: "open" }).catch(() => {});
  }, [p.token, p.status, stage]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function download() {
    await run(async () => {
      const j = await call(p.token, { action: "download" });
      if (j.url) window.location.href = j.url;
    });
  }

  const card = "rounded-2xl bg-white p-5 shadow-sm sm:p-6";

  if (p.status === "void") {
    return (
      <Shell>
        <div className={card}>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>This document has been cancelled</h1>
          <p className="mt-2 text-slate-600">{sender} cancelled &ldquo;{p.title}&rdquo;, so there&apos;s nothing to sign. If you weren&apos;t expecting this, reply to the email.</p>
        </div>
      </Shell>
    );
  }

  if (stage === "done") {
    return (
      <Shell>
        <div className={`${card} text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
          <h1 className="mt-4 text-2xl font-bold" style={{ color: NAVY }}>Signed. Thank you!</h1>
          <p className="mt-2 text-slate-600">
            {completed ? "Everyone has signed. A signed copy has been emailed to you, and you can download it here." : "We'll email you the signed copy as soon as everyone has signed."}
          </p>
          {completed && (
            <button onClick={download} disabled={busy} className="mt-5 rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50" style={{ background: ORANGE }}>
              Download the signed PDF
            </button>
          )}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <p className="mt-6 text-xs text-slate-400">Document ID {p.docId}</p>
        </div>
      </Shell>
    );
  }

  if (stage === "declined") {
    return (
      <Shell>
        <div className={card}>
          <h1 className="text-xl font-bold" style={{ color: NAVY }}>You declined to sign</h1>
          <p className="mt-2 text-slate-600">We&apos;ve let {sender} know. If you&apos;d like anything changed, just reply to the email.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={card}>
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>Please review and sign</p>
        <h1 className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>{p.title}</h1>
        <p className="mt-1 text-slate-600">
          From {sender}, Reach Network Recruitment{p.companyName ? ` · for ${p.companyName}` : ""}
        </p>
        {p.message && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{p.message}</p>}
        <button onClick={() => signRef.current?.scrollIntoView({ behavior: "smooth" })} className="mt-4 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: ORANGE }}>
          Skip to signing ↓
        </button>
      </div>

      {/* The document */}
      <div className="mt-4">
        {p.html ? (
          <article className="rounded-2xl bg-white p-6 text-[15px] leading-relaxed text-slate-800 shadow-sm sm:p-10" dangerouslySetInnerHTML={{ __html: p.html }} />
        ) : p.pdfUrl ? (
          <PdfPages url={p.pdfUrl} />
        ) : null}
      </div>

      {/* Signing */}
      <div ref={signRef} className={`${card} mt-4 scroll-mt-4`}>
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>Sign</h2>
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {!verified ? (
          <div className="mt-3">
            <p className="text-sm text-slate-600">
              <b>Step 1 of 2:</b> to keep this secure, we&apos;ll email a 6-digit code to <b>{p.email}</b>.
            </p>
            {!codeSent ? (
              <button onClick={() => run(async () => (await call(p.token, { action: "send_code" }), setCodeSent(true)))} disabled={busy} className="mt-3 w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50 sm:w-auto" style={{ background: ORANGE }}>
                {busy ? "Sending…" : "Email me a code"}
              </button>
            ) : (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.4em] focus:border-[#F7931E] focus:outline-none sm:w-48"
                />
                <button onClick={() => run(async () => (await call(p.token, { action: "verify", code }), setVerified(true)))} disabled={busy || code.length !== 6} className="rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50" style={{ background: ORANGE }}>
                  Confirm
                </button>
                <button onClick={() => run(async () => (await call(p.token, { action: "send_code" }), setCode("")))} disabled={busy} className="text-sm text-slate-500 underline">
                  Send a new code
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-4">
            <p className="text-sm text-green-700">✓ Email confirmed. <b className="text-slate-700">Step 2 of 2:</b> add your signature.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-slate-600">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#F7931E] focus:outline-none" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-slate-600">Job title</span>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Operations Director" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-[#F7931E] focus:outline-none" />
              </label>
            </div>

            <div>
              <div className="mb-2 flex gap-2">
                {(["typed", "drawn"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-lg border px-3 py-1.5 text-sm ${mode === m ? "border-[#F7931E] bg-orange-50 font-semibold" : "border-slate-200 text-slate-600"}`}>
                    {m === "typed" ? "Type it" : "Draw it"}
                  </button>
                ))}
              </div>
              {mode === "typed" ? (
                <div className="flex h-24 items-center rounded-lg border border-slate-200 bg-slate-50 px-5">
                  <span className="truncate text-4xl" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive", color: NAVY }}>
                    {name || "Your name"}
                  </span>
                </div>
              ) : (
                <DrawPad onChange={setDrawing} />
              )}
            </div>

            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none" />
              <span>
                I have read &ldquo;{p.title}&rdquo; and agree to it{p.companyName ? `, and I'm authorised to sign on behalf of ${p.companyName}` : ""}. I agree that my electronic signature is as valid as signing by hand.
              </span>
            </label>

            <button
              onClick={() =>
                run(async () => {
                  if (mode === "drawn" && !drawing) throw new Error("Draw your signature in the box, or choose Type it.");
                  const j = await call(p.token, { action: "sign", name, job_title: jobTitle, type: mode, data: mode === "drawn" ? drawing : name, agree });
                  setCompleted(!!j.completed);
                  setStage("done");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                })
              }
              disabled={busy || !agree || name.trim().length < 2}
              className="w-full rounded-lg px-5 py-3.5 text-lg font-bold text-white disabled:opacity-50"
              style={{ background: ORANGE }}
            >
              {busy ? "Signing…" : "Sign"}
            </button>
            {p.senderSigned && <p className="text-center text-xs text-slate-500">Already signed by {sender} for Reach Network Recruitment.</p>}
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4">
          {!declining ? (
            <button onClick={() => setDeclining(true)} className="text-sm text-slate-500 underline">
              I don&apos;t want to sign this
            </button>
          ) : (
            <div className="space-y-2">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="What would you like changed? (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={() => run(async () => (await call(p.token, { action: "decline", reason }), setStage("declined")))} disabled={busy} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700">
                  Decline to sign
                </button>
                <button onClick={() => setDeclining(false)} className="text-sm text-slate-500">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Document ID {p.docId} · Secure electronic signing by Reach Network Recruitment
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <header className="px-5 py-4" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-extrabold text-white" style={{ background: ORANGE }}>
            R
          </span>
          <span className="font-bold text-white">Reach Network Recruitment</span>
          <span className="ml-auto text-xs text-slate-300">🔒 Secure signing</span>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 pt-5">{children}</div>
    </main>
  );
}
