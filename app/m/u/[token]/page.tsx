// Unsubscribe page linked from every campaign email
import type { Metadata } from "next";
import { admin } from "@/lib/crmServer";
import UnsubscribeButton from "./UnsubscribeButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe | Reach Network Recruitment", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: s } = await admin().from("crm_mail_sends").select("email, unsubscribed_at").eq("token", token).maybeSingle();
  const masked = s ? s.email.replace(/^(.).*?(@.*)$/, "$1•••$2") : "";
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F2438]">Unsubscribe</h1>
        {!s ? (
          <p className="mt-3 text-slate-600">This link isn&apos;t valid any more. Reply to the email and we&apos;ll take you off our list.</p>
        ) : (
          <UnsubscribeButton token={token} email={masked} already={!!s.unsubscribed_at} />
        )}
      </div>
    </main>
  );
}
