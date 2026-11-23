import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why choose Reach Network Recruitment",
  description: "Specialist sectors, proper checks, live technology and a team who know your sites. See how we compare with a typical agency.",
  alternates: { canonical: "/why-choose-us" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
