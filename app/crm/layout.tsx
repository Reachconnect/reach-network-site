"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CrmShell from "./CrmShell";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok" | "no">("checking");
  const isLogin = pathname === "/crm/login";

  useEffect(() => {
    if (isLogin) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/crm/login");
        return;
      }
      // Only Reach agency staff can use the CRM
      const { data: staff } = await supabase.from("agency_users").select("id").eq("user_id", data.user.id).maybeSingle();
      if (!staff) {
        await supabase.auth.signOut();
        router.push("/crm/login");
        return;
      }
      setState("ok");
    })();
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (state !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#1F3447]" />
      </div>
    );
  }

  return <CrmShell>{children}</CrmShell>;
}