"use client";

// The cookie banner, and (only if someone accepts) a record of which pages they look at.
// When someone arrives from one of our emails or spec links, the CRM knows who they are.
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "rnr_consent";
const VID_COOKIE = "rnr_vid";
const SKIP = [/^\/crm/, /^\/admin/, /^\/s\//, /^\/m\//, /^\/sign/, /^\/api/];

function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function visitorId() {
  const m = document.cookie.match(/(?:^|; )rnr_vid=([A-Za-z0-9_-]{16,40})/);
  if (m) return m[1];
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const id = btoa(String.fromCharCode(...Array.from(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  document.cookie = `${VID_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;
  return id;
}

// Who they are, if they came from one of our links
function identity(path: string): { kind: "mail" | "spec"; token: string } | null {
  const mail = new URLSearchParams(window.location.search).get("rnr");
  if (mail && /^[A-Za-z0-9_-]{10,60}$/.test(mail)) return { kind: "mail", token: mail };
  const spec = path.match(/^\/spec\/([A-Za-z0-9_-]{10,60})/);
  if (spec && !window.location.search.includes("preview=1")) return { kind: "spec", token: spec[1] };
  return null;
}

export default function SiteTracker() {
  const path = usePathname() || "/";
  const [choice, setChoice] = useState<string | null>("unknown");
  const visit = useRef<{ id: string | null; start: number } | null>(null);
  const pendingIdentity = useRef<{ kind: "mail" | "spec"; token: string } | null>(null);
  const skip = SKIP.some((r) => r.test(path));

  useEffect(() => {
    setChoice(getConsent());
    const reopen = () => setChoice(null);
    window.addEventListener("rnr-cookie-settings", reopen);
    return () => window.removeEventListener("rnr-cookie-settings", reopen);
  }, []);

  function sendTime() {
    const v = visit.current;
    if (!v?.id) return;
    const seconds = Math.round((Date.now() - v.start) / 1000);
    if (seconds < 1) return;
    const body = JSON.stringify({ action: "time", visitId: v.id, vid: visitorId(), seconds });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/visit", new Blob([body], { type: "application/json" }));
    visit.current = null;
  }

  async function record() {
    const ident = identity(path) || pendingIdentity.current;
    pendingIdentity.current = null;
    try {
      const res = await fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ action: "view", vid: visitorId(), path, title: document.title.slice(0, 160), ref: document.referrer.slice(0, 300), ident }),
      });
      const j = await res.json().catch(() => ({}));
      visit.current = { id: j.visitId || null, start: Date.now() };
    } catch {
      // never get in the way of the page
    }
  }

  // Each page they look at
  useEffect(() => {
    if (skip) return;
    if (choice === "unknown") return;
    if (choice !== "yes") {
      // Remember who they are for this page only, in case they accept the banner
      pendingIdentity.current = identity(path);
      return;
    }
    record();
    const hide = () => document.visibilityState === "hidden" && sendTime();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", sendTime);
    return () => {
      sendTime();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", sendTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, choice, skip]);

  function decide(yes: boolean) {
    try {
      localStorage.setItem(CONSENT_KEY, yes ? "yes" : "no");
    } catch {
      // fine
    }
    if (!yes) document.cookie = `${VID_COOKIE}=; path=/; max-age=0`;
    setChoice(yes ? "yes" : "no");
  }

  if (skip || choice !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl bg-[#0F2438] p-4 text-sm text-white shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 leading-relaxed text-white/85">
          We&apos;d like to use a cookie to see which pages are useful and, if you came from one of our emails, to remember you so we can help you better. Nothing is shared with advertisers.{" "}
          <a href="/privacy-notice#cookies" className="underline">
            More about cookies
          </a>
        </p>
        <div className="flex flex-none gap-2">
          <button onClick={() => decide(false)} className="flex-1 rounded-lg border border-white/40 px-4 py-2 font-semibold sm:flex-none">
            No thanks
          </button>
          <button onClick={() => decide(true)} className="flex-1 rounded-lg bg-[#F7931E] px-4 py-2 font-semibold sm:flex-none">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
