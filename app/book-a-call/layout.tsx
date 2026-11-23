import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a call | Reach Network Recruitment",
  description: "Pick a time and we'll call you. Free 15-minute calls for employers and candidates.",
  alternates: { canonical: "/book-a-call" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
