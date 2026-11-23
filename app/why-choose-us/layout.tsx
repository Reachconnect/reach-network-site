import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Why choose Reach Network Recruitment",
  description: "Specialist sectors, proper checks, live technology and a team who know your sites. See how we compare with a typical agency.",
  alternates: { canonical: "/why-choose-us" },
  ...ogMeta({ title: "A recruitment partner you can actually see working", description: "Specialist sectors, proper checks, live technology and a team who know your sites. See how we compare with a typical agency.", path: "/why-choose-us", kicker: "Why choose us", sub: "Specialist sectors, proper checks and live technology.", photo: "office" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
