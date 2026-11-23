import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permanent recruitment | Reach Network Recruitment",
  description: "Permanent hiring for driving, warehouse, manufacturing and engineering roles, with a screened shortlist.",
  alternates: { canonical: "/permanent-recruitment" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
