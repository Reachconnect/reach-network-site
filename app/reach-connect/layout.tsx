import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reach Connect: live clock-ins, timesheets and costs for temp staff | Reach Network Recruitment",
  description: "The client portal for Reach temporary staffing clients: see who's on site, approve timesheets in a tap and track costs by site.",
  alternates: { canonical: "/reach-connect" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
