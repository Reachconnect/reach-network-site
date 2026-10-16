"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_REACHCONNECT_URL || "https://reachnetworkconnect.com";
const TOKEN_KEY = "reach-webchat-token";
const SEEN_KEY = "reach-webchat-seen";

type Msg = { id: string; fromVisitor: boolean; text: string; at: string };

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function WebChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hidden = !!pathname && (pathname.startsWith("/rewards") || pathname.startsWith("/crm"));

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY));
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/webchat/messages?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.status === 404) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setMessages([]);
        return;
      }
      const json = await res.json();
      const list = (json.messages ?? []) as Msg[];
      setMessages(list);
      const lastReply = [...list].reverse().find((m) => !m.fromVisitor);
      const seen = localStorage.getItem(SEEN_KEY);
      if (lastReply && lastReply.id !== seen && !open) setUnread(true);
    } catch {
      // try again next time
    }
  }, [token, open]);

  useEffect(() => {
    if (!token || hidden) return;
    load();
    const t = setInterval(load, open ? 4000 : 20000);
    return () => clearInterval(t);
  }, [token, open, load, hidden]);

  useEffect(() => {
    if (!open) return;
    setUnread(false);
    const lastReply = [...messages].reverse().find((m) => !m.fromVisitor);
    if (lastReply) localStorage.setItem(SEEN_KEY, lastReply.id);
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages]);

  // Not on the Reach Rewards or CRM pages
  if (hidden) return null;

  async function start() {
    if (!name.trim() || !text.trim()) return setError("Please add your name and a message.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/webchat/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sorry, something went wrong.");
      localStorage.setItem(TOKEN_KEY, json.token);
      setToken(json.token);
      setMessages([{ id: "pending", fromVisitor: true, text: text.trim(), at: new Date().toISOString() }]);
      setText("");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function send() {
    if (!token || !text.trim()) return;
    const body = text.trim();
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { id: `local-${Date.now()}`, fromVisitor: true, text: body, at: new Date().toISOString() }]);
    setText("");
    try {
      const res = await fetch(`${API}/api/webchat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message: body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sorry, that didn't send.");
      setTimeout(load, 1500);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  function newChat() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SEEN_KEY);
    setToken(null);
    setMessages([]);
  }

  const lastMsg = messages[messages.length - 1];
  const waitingForReply = !!lastMsg && lastMsg.fromVisitor && Date.now() - new Date(lastMsg.at).getTime() < 90000;

  return (
    <div className="fixed bottom-5 right-5 z-[60] font-[family-name:var(--font-inter)]">
      {open && (
        <div
          role="dialog"
          aria-label="Chat with Reach Network Recruitment"
          className="mb-3 flex h-[min(34rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 bg-[#0F2438] px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7931E] font-bold">R</div>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-manrope)] font-bold">Reach Network Recruitment</p>
              <p className="text-xs text-white/70">We usually reply within minutes</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!token ? (
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                Hi! 👋 Looking for work, or need staff? Send us a message and we&apos;ll get straight back to you.
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile number (optional)"
                inputMode="tel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="How can we help?"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={start} disabled={busy} className="w-full rounded-lg bg-[#F7931E] px-4 py-3 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                {busy ? "Starting…" : "Start chat"}
              </button>
              <p className="text-xs text-slate-500">We&apos;ll only use your details to help with your enquiry.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromVisitor ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        m.fromVisitor ? "rounded-br-md bg-[#F7931E] text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`mt-0.5 text-right text-[10px] ${m.fromVisitor ? "text-white/75" : "text-slate-400"}`}>{time(m.at)}</p>
                    </div>
                  </div>
                ))}
                {waitingForReply && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200" aria-label="Typing">
                      <span className="inline-flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 p-3">
                {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="max-h-28 min-h-[42px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-[#F7931E] focus:outline-none focus:ring-2 focus:ring-[#F7931E]/30"
                  />
                  <button onClick={send} disabled={busy || !text.trim()} aria-label="Send" className="flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#F7931E] text-white disabled:opacity-40">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </div>
                <button onClick={newChat} className="mt-2 text-xs text-slate-400 hover:text-slate-600">
                  Start a new chat
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="relative ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7931E] text-white shadow-lg transition hover:scale-105"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {unread && !open && <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />}
      </button>
    </div>
  );
}