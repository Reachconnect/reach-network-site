// Public spec page: an anonymised candidate profile sent to a prospective client
import type { Metadata } from "next";
import { admin } from "@/lib/crmServer";
import { cleanContent, VIDEO_BUCKET } from "@/lib/specs";
import SpecClient from "./SpecClient";
import ShortlistClient from "./ShortlistClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candidate profile | Reach Network Recruitment",
  robots: { index: false, follow: false },
};

export default async function SpecPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { token } = await params;
  const { preview } = await searchParams;

  const { data: spec } = await admin()
    .from("crm_specs")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!spec || spec.withdrawn || (spec.expires_at && new Date(spec.expires_at) < new Date())) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900">This profile is no longer available</h1>
          <p className="mt-3 text-slate-600">
            The candidate may have found a role. Get in touch and we&apos;ll show you who&apos;s available now.
          </p>
          <a href="/i-need-staff" className="mt-6 inline-block rounded-lg bg-[#F7931E] px-5 py-3 font-semibold text-white">
            Talk to Reach Network Recruitment
          </a>
        </div>
      </main>
    );
  }

  // The recruiter's intro video, if there is one (a private file, so a link that lasts 12 hours)
  let videoUrl: string | null = null;
  if (spec.video_path) {
    const { data: signed } = await admin().storage.from(VIDEO_BUCKET).createSignedUrl(spec.video_path, 12 * 3600);
    videoUrl = signed?.signedUrl ?? null;
  }

  // A shortlist of several candidates
  const items = Array.isArray(spec.items) ? (spec.items as { content: unknown }[]) : [];
  if (items.length > 1) {
    return (
      <ShortlistClient
        token={spec.token}
        preview={preview === "1"}
        companyName={spec.company_name}
        contactName={spec.contact_name}
        roleTitle={spec.role_title}
        intro={spec.intro}
        introducedOn={spec.created_at}
        alreadyResponded={spec.response}
        videoUrl={videoUrl}
        people={items.map((i) => cleanContent(i.content as Parameters<typeof cleanContent>[0]))}
      />
    );
  }

  return (
    <SpecClient
      token={spec.token}
      preview={preview === "1"}
      companyName={spec.company_name}
      contactName={spec.contact_name}
      roleTitle={spec.role_title}
      introducedOn={spec.created_at}
      alreadyResponded={spec.response}
      videoUrl={videoUrl}
      content={cleanContent(spec.content)}
    />
  );
}
