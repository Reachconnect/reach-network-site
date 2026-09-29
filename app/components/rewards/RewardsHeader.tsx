"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RewardsMe } from "@/lib/useRewardsUser";

export default function RewardsHeader({ me, onSignOut }: { me: RewardsMe | null; onSignOut?: () => void }) {
  const path = usePathname();

  const links: { href: string; label: string }[] = [];
  if (me) {
    links.push({ href: "/rewards/offers", label: "Offers" });
    if (me.adminOf.length > 0) links.push({ href: "/rewards/company", label: "My team" });
    if (me.isAgency) links.push({ href: "/rewards/admin", label: "Reach admin" });
  }

  return (
    <header className="bg-[#0F2438] text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href={me ? "/rewards/offers" : "/rewards"} className="text-xl font-bold tracking-tight">
          Reach <span className="text-[#F7931E]">Rewards</span>
        </Link>
        {me ? (
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 ${
                  path?.startsWith(l.href) ? "bg-white/10 font-semibold" : "text-white/80 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {onSignOut && (
              <button onClick={onSignOut} className="rounded-md px-3 py-2 text-white/80 hover:text-white">
                Log out
              </button>
            )}
          </nav>
        ) : (
          <Link
            href="/rewards/login"
            className="rounded-lg bg-[#F7931E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e2841a]"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  );
}