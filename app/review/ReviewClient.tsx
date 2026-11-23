"use client";

// "How did we do?" Everyone gets the same options: a public Google review and private feedback.
import { useState } from "react";

export default function ReviewClient({ googleUrl }: { googleUrl: string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy focus:border-orange focus:outline-none";

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: f.name, workEmail: f.email, phoneNumber: f.phone, companyName: f.company || "Feedback", jobTitle: "", helpTopic: "Feedback", message: f.message }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
        <p className="text-4xl text-orange">★★★★★</p>
        <p className="mt-4 font-display text-2xl font-extrabold text-navy">Leave a Google review</p>
        <p className="mt-2 flex-1 text-slate-600">It takes a minute and helps other businesses and workers find us. Good or bad, we read every one.</p>
        {googleUrl ? (
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="mt-6 rounded-full bg-orange px-6 py-3.5 text-center font-bold text-white hover:bg-orange-dark">
            Review us on Google
          </a>
        ) : (
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Our Google page is coming soon. In the meantime, please send us your thoughts.</p>
        )}
      </div>
      <div className="rounded-3xl bg-navy p-8 text-white">
        <p className="font-display text-2xl font-extrabold">Tell us privately</p>
        <p className="mt-2 text-white/70">Something we could do better? It goes straight to us.</p>
        {status === "done" ? (
          <p className="mt-6 rounded-xl bg-white/10 p-4 font-semibold">Thank you. We&apos;ll be in touch if you&apos;ve asked us to.</p>
        ) : (
          <form onSubmit={send} className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
              <input className={input} placeholder="Company (if a client)" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
              <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
              <input className={input} type="tel" placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
            </div>
            <textarea className={input} rows={4} placeholder="Your feedback" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button disabled={status === "sending"} className="w-full rounded-full bg-orange px-6 py-3.5 font-bold hover:bg-orange-dark disabled:opacity-50">
              {status === "sending" ? "Sending…" : "Send feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
