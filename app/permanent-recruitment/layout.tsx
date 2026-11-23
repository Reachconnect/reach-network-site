import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Permanent recruitment | Reach Network Recruitment",
  description: "Permanent hiring for driving, warehouse, manufacturing and engineering roles, with a screened shortlist.",
  alternates: { canonical: "/permanent-recruitment" },
  ...ogMeta({ title: "Permanent hires, properly screened", description: "Permanent hiring for driving, warehouse, manufacturing and engineering roles, with a screened shortlist.", path: "/permanent-recruitment", kicker: "Permanent recruitment", sub: "A shortlist you can trust, and support to day one.", photo: "engineering" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
