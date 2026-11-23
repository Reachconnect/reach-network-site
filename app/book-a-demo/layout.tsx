import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Reach Connect demo | Reach Network Recruitment",
  description: "See Reach Connect in 15 minutes: live clock-ins, timesheets in a tap and costs by site, for our temporary staffing clients.",
  alternates: { canonical: "/book-a-demo" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
