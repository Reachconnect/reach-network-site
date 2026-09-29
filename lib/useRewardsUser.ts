"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";

export type RewardsMe = {
  userId: string;
  email: string | null;
  name: string;
  isAgency: boolean;
  isWorker: boolean;
  adminOf: { id: string; name: string }[];
  member: { id: string; role: "admin" | "employee"; companyId: string; companyName: string } | null;
  hasAccess: boolean;
};

export async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchMe(): Promise<RewardsMe | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch("/api/rewards/me", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return res.json();
}

export function homeFor(me: RewardsMe) {
  if (me.isAgency) return "/rewards/admin";
  if (me.adminOf.length) return "/rewards/company";
  return "/rewards/offers";
}

export async function rewardsApi(path: string, body: unknown) {
  const token = await getToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

export function useRewardsUser(need: "member" | "companyAdmin" | "agency" = "member") {
  const router = useRouter();
  const [me, setMe] = useState<RewardsMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await fetchMe();
      if (cancelled) return;
      if (!m || !m.hasAccess) return router.replace("/rewards/login");
      if (need === "agency" && !m.isAgency) return router.replace(homeFor(m));
      if (need === "companyAdmin" && !m.isAgency && m.adminOf.length === 0) return router.replace(homeFor(m));
      setMe(m);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [need, router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/rewards/login");
  }, [router]);

  return { me, loading, signOut };
}