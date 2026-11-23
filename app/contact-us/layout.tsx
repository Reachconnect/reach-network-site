import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact us | Reach Network Recruitment",
  description: "Call 0121 630 1643, email info@reachnetworkrec.com or visit us at 132a High Street, Bromsgrove, B61 8ES.",
  alternates: { canonical: "/contact-us" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
