import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";

export const metadata: Metadata = {
  title: "Book a call | Reach Network Recruitment",
  description: "Pick a time and we'll call you. Free 15-minute calls for employers and candidates.",
  alternates: { canonical: "/book-a-call" },
  ...ogMeta({ title: "Pick a time. We'll call you.", description: "Pick a time and we'll call you. Free 15-minute calls for employers and candidates.", path: "/book-a-call", kicker: "Book a call", sub: "A free 15-minute call, whether you're hiring or looking for work.", photo: "office" }),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
