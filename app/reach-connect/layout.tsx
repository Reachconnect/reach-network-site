import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Reach Connect: live clock-ins, timesheets and costs for temp staff | Reach Network Recruitment",
  description: "The client portal for Reach temporary staffing clients: see who's on site, approve timesheets in a tap and track costs by site.",
  alternates: { canonical: "/reach-connect" },
  ...ogMeta({ title: "Stop phoning round. Just look.", description: "The client portal for Reach temporary staffing clients: see who's on site, approve timesheets in a tap and track costs by site.", path: "/reach-connect", kicker: "Reach Connect", sub: "See who's on site, approve timesheets and track costs, live.", photo: "connect" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
