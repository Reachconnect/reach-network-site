// Take-home pay calculator
import type { Metadata } from "next";
import TakeHomeClient, { type RateJob } from "./TakeHomeClient";
import { listPublicJobs } from "@/lib/jobsPublic";
import { ogMeta } from "@/lib/og";

export const revalidate = 3600;

const description = "Work out your weekly take-home pay from your hourly rate for 2026/27, after tax, National Insurance, pension and student loan. Includes overtime and holiday pay.";

export const metadata: Metadata = {
  title: "Take-home pay calculator 2026/27: hourly to weekly pay after tax | Reach Network Recruitment",
  description,
  alternates: { canonical: "/take-home-pay" },
  ...ogMeta({ title: "What will I actually take home?", description, path: "/take-home-pay", kicker: "Free calculator · 2026/27", sub: "Hourly rate to weekly pay after tax, NI and pension", tag: "Free tool" }),
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How much tax do I pay on £13.50 an hour for 40 hours a week?", acceptedAnswer: { "@type": "Answer", text: "On the standard 1257L tax code in 2026/27, £540 a week gross means about £59.65 income tax and £23.84 National Insurance, leaving about £456.51 a week before any pension or student loan." } },
    { "@type": "Question", name: "What is the Personal Allowance for 2026/27?", acceptedAnswer: { "@type": "Answer", text: "£12,570 a year, or about £242 a week." } },
  ],
};

export default async function TakeHomePage() {
  const jobs: RateJob[] = (await listPublicJobs().catch(() => []))
    .map((j) => {
      const from = Number(j.salary_from) || 0;
      const to = Number(j.salary_to) || 0;
      const hourly = to && to < 100 ? to : from && from < 100 ? from : 0;
      return { key: j.key, title: j.title, href: j.href, hourly, area: j.area || j.location, salary: j.salary };
    })
    .filter((j) => j.hourly >= 8);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <TakeHomeClient jobs={jobs} />
    </>
  );
}
