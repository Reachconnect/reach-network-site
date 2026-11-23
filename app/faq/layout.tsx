import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "FAQ: pricing, checks, Reach Connect and applying for work | Reach Network Recruitment",
  description: "Answers to common questions from employers and candidates: pricing, terms, worker checks, pay, clock-ins and Reach Connect.",
  alternates: { canonical: "/faq" },
  ...ogMeta({ title: "How can we help?", description: "Answers to common questions from employers and candidates: pricing, terms, worker checks, pay, clock-ins and Reach Connect.", path: "/faq", kicker: "FAQ", sub: "Pricing, checks, Reach Connect and applying for work." }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
