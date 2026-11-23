import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "How it works for employers and candidates | Reach Network Recruitment",
  description: "Step by step, from your first call to the first shift: how Reach finds, checks and supplies staff, and how candidates get started.",
  alternates: { canonical: "/how-it-works" },
  ...ogMeta({ title: "Simple steps. No surprises.", description: "Step by step, from your first call to the first shift: how Reach finds, checks and supplies staff, and how candidates get started.", path: "/how-it-works", kicker: "How it works", sub: "From first call to first shift, for employers and candidates.", photo: "warehouse" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
