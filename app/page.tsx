import HomeClient from "./HomeClient";
import { listPublicJobs } from "@/lib/jobsPublic";

export const dynamic = "force-dynamic";

// Homepage: the latest published jobs are passed to the page
export default async function HomePage() {
  const all = await listPublicJobs().catch(() => []);
  const jobs = all
    .slice()
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6)
    .map((j) => ({ key: j.key, title: j.title, category: j.category, location: j.area || j.location, salary: j.salary, employment_type: j.employment_type, href: j.href }));
  return <HomeClient jobs={jobs} jobCount={all.length} />;
}
