"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon, type Specialism } from "./crm";

const THEMES = {
  navy: {
    aside: "bg-[#1F3447] text-slate-100",
    label: "text-slate-400",
    item: "text-slate-200 hover:bg-white/10 hover:text-white",
    active: "bg-[#F7931E] text-white font-semibold",
    divider: "border-white/10",
    soon: "text-slate-500",
  },
  light: {
    aside: "bg-white text-slate-700 border-r border-slate-200",
    label: "text-slate-400",
    item: "text-slate-600 hover:bg-slate-100 hover:text-[#1F3447]",
    active: "bg-orange-50 text-[#1F3447] font-semibold shadow-[inset_3px_0_0_#F7931E]",
    divider: "border-slate-200",
    soon: "text-slate-400",
  },
};

type Theme = keyof typeof THEMES;
type Counts = { bySpecialism: Record<string, number>; due: number; openDeals: number };

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("navy");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [specialisms, setSpecialisms] = useState<Specialism[]>([]);
  const [counts, setCounts] = useState<Counts>({ bySpecialism: {}, due: 0, openDeals: 0 });

  useEffect(() => {
    try {
      const t = localStorage.getItem("reach-crm-menu-theme");
      if (t === "navy" || t === "light") setTheme(t);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const load = useCallback(async () => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const [s, c, r, d] = await Promise.all([
      supabase.from("crm_specialisms").select("*").order("sort_order").order("name"),
      supabase.from("crm_candidates").select("specialism_id").limit(20000),
      supabase.from("crm_reminders").select("id", { count: "exact", head: true }).eq("done", false).lte("due_at", endOfToday.toISOString()),
      supabase.from("crm_companies").select("id", { count: "exact", head: true }).not("stage", "in", "(client,lost)"),
    ]);
    setSpecialisms((s.data ?? []) as Specialism[]);
    const by: Record<string, number> = {};
    for (const row of (c.data ?? []) as { specialism_id: string | null }[]) {
      const key = row.specialism_id || "none";
      by[key] = (by[key] || 0) + 1;
    }
    setCounts({ bySpecialism: by, due: r.count ?? 0, openDeals: d.count ?? 0 });
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load, pathname]);

  function toggleTheme() {
    const next = theme === "navy" ? "light" : "navy";
    setTheme(next);
    try {
      localStorage.setItem("reach-crm-menu-theme", next);
    } catch {
      // ignore
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/crm/login");
  }

  const t = THEMES[theme];
  const onSales = pathname.startsWith("/crm/sales");

  const menu = (
    <div className={`flex h-full flex-col ${t.aside}`}>
      <div className="flex items-center gap-2 px-4 pb-4 pt-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7931E] text-sm font-bold text-white">R</span>
        <span className="text-lg font-bold">
          Reach <span className="font-medium opacity-80">CRM</span>
        </span>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <Suspense fallback={null}>
          <MenuLinks theme={theme} pathname={pathname} specialisms={specialisms} counts={counts} />
        </Suspense>

        <p className={`mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider ${t.label}`}>Sales</p>
        <Link
          href="/crm/sales"
          className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${onSales ? t.active : t.item}`}
        >
          <Icon name="funnel" />
          <span className="flex-1">Sales pipeline</span>
          {!!counts.openDeals && (
            <span className={`min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${onSales ? "bg-white/25" : "opacity-60"}`}>
              {counts.openDeals}
            </span>
          )}
        </Link>
        {[
          ["Clients and terms", "handshake"],
          ["Campaigns", "send"],
        ].map(([label, icon]) => (
          <div key={label} className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${t.soon}`}>
            <Icon name={icon} />
            <span className="flex-1">{label}</span>
            <span className="rounded-full border border-current px-1.5 text-[10px] font-semibold">Soon</span>
          </div>
        ))}
      </nav>

      <div className={`flex items-center gap-1 border-t px-3 py-3 ${t.divider}`}>
        <button onClick={toggleTheme} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${t.item}`}>
          <Icon name={theme === "navy" ? "sun" : "moon"} className="h-4 w-4" />
          {theme === "navy" ? "Light menu" : "Navy menu"}
        </button>
        <button onClick={signOut} title="Sign out" aria-label="Sign out" className={`ml-auto rounded-lg p-2 ${t.item}`}>
          <Icon name="logout" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 lg:block">{menu}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-72 max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
            {menu}
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={`flex items-center gap-3 px-4 py-3 lg:hidden ${t.aside}`}>
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5">
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <span className="font-bold">Reach CRM</span>
          {counts.due > 0 && (
            <Link href="/crm" className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {counts.due} due
            </Link>
          )}
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function MenuLinks({ theme, pathname, specialisms, counts }: { theme: Theme; pathname: string; specialisms: Specialism[]; counts: Counts }) {
  const params = useSearchParams();
  const slug = params.get("s");
  const t = THEMES[theme];
  const onCandidates = pathname.startsWith("/crm/candidates");

  const link = (href: string, label: string, icon: React.ReactNode, active: boolean, badge?: number, red = false) => (
    <Link key={href} href={href} className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? t.active : t.item}`}>
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {!!badge && (
        <span className={`min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold ${red ? "bg-red-500 text-white" : active ? "bg-white/25" : "opacity-60"}`}>
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {link("/crm", "Home", <Icon name="home" />, pathname === "/crm", counts.due, true)}
      <p className={`mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider ${t.label}`}>Candidates</p>
      {link(
        "/crm/candidates",
        "All candidates",
        <Icon name="users" />,
        pathname === "/crm/candidates" && !slug,
        Object.values(counts.bySpecialism).reduce((a, b) => a + b, 0)
      )}
      {specialisms.map((s) =>
        link(
          `/crm/candidates?s=${s.slug}`,
          s.name,
          <span className="w-[18px] text-center text-base leading-none">{s.emoji}</span>,
          onCandidates && slug === s.slug,
          counts.bySpecialism[s.id]
        )
      )}
    </>
  );
}