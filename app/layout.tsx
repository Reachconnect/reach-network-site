import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import WebChat from "./components/WebChat";
import SiteTracker from "./components/SiteTracker";
import WhatsAppButton from "./components/WhatsAppButton";
import { ogMeta } from "@/lib/og";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reachnetworkrec.com"),
  title: "Reach Network Recruitment | Drivers, warehouse, manufacturing and engineering staff",
  description:
    "We go beyond recruitment to deliver the right people, the right support, and the right results. Driving, warehousing, manufacturing and engineering staffing across the UK.",
  ...ogMeta({ title: "We find your staff, and show you it all, live", description: "Checked drivers, warehouse, manufacturing and engineering staff, with live clock-ins, timesheets and costs in Reach Connect.", path: "/", kicker: "Specialist recruitment", sub: "Drivers · Warehouse · Manufacturing · Engineering", photo: "drivers" }),
  // Set GOOGLE_SITE_VERIFICATION in Vercel to the code Google Search Console gives you
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${inter.variable} antialiased`}>
        {children}
        <WebChat />
        <WhatsAppButton />
        <SiteTracker />
      </body>
    </html>
  );
}