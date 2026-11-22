// The page a signer opens from their email
import type { Metadata } from "next";
import { admin } from "@/lib/crmServer";
import { SIGN_BUCKET, shortId } from "@/lib/esign";
import { docHtml } from "@/lib/esignText";
import SignClient from "./SignClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Review and sign | Reach Network Recruitment", robots: { index: false, follow: false } };

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = admin();
  const { data: s } = await db.from("crm_sign_signers").select("*, crm_sign_envelopes(*)").eq("token", token).maybeSingle();
  const env = s?.crm_sign_envelopes;

  if (!s || !env) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#0F2438]">This signing link isn&apos;t valid</h1>
          <p className="mt-2 text-slate-600">Please use the latest email you were sent, or reply to it and we&apos;ll help.</p>
        </div>
      </main>
    );
  }

  const pdfUrl = env.pdf_path ? (await db.storage.from(SIGN_BUCKET).createSignedUrl(env.pdf_path, 3 * 3600)).data?.signedUrl ?? null : null;
  const maskedEmail = s.email.replace(/^(.)(.*)(@.*)$/, (_m: string, a: string, b: string, c: string) => `${a}${"•".repeat(Math.min(6, b.length))}${c}`);

  return (
    <SignClient
      token={token}
      title={env.title}
      docId={shortId(env.id)}
      companyName={env.company_name}
      html={env.body ? docHtml(env.body) : null}
      pdfUrl={pdfUrl}
      status={env.status}
      signerName={s.name}
      signerTitle={s.job_title}
      email={maskedEmail}
      signedAt={s.signed_at}
      declined={!!s.declined_at}
      verified={!!s.verified_at && Date.now() - new Date(s.verified_at).getTime() < 6 * 3600 * 1000}
      senderName={env.sender_name}
      senderSigned={!!env.sender_signed_at}
      message={env.message}
    />
  );
}
