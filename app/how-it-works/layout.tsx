import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works for employers and candidates | Reach Network Recruitment",
  description: "Step by step, from your first call to the first shift: how Reach finds, checks and supplies staff, and how candidates get started.",
  alternates: { canonical: "/how-it-works" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
