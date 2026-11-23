import type { Metadata } from "next";
import LookingForWorkClient from "./LookingForWorkClient";
import { listPublicJobs } from "@/lib/jobsPublic";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs: driving, warehouse, manufacturing and engineering work | Reach Network Recruitment",
  description: "Live HGV, van, warehouse, FLT, production and engineering jobs across the Midlands and UK. Free to apply in two minutes, or send us your CV.",
  alternates: { canonical: "/looking-for-work" },
};

// Jobs published from the CRM, plus any still on the older website job list
export default async function LookingForWorkPage() {
  const jobs = (await listPublicJobs()).map((j) => ({
    id: j.key,
    title: j.title,
    category: j.category,
    location: j.area || j.location,
    employment_type: j.employment_type,
    salary: j.salary,
    description: j.summary || j.description,
    status: "open",
    created_at: j.created_at,
    href: j.href,
  }));
  return <LookingForWorkClient jobs={jobs} />;
}
