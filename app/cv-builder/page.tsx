// Free AI CV builder
import type { Metadata } from "next";
import CvBuilderClient from "./CvBuilderClient";
import { ogMeta } from "@/lib/og";

const description = "Build a professional CV in 5 minutes, free. Add your jobs, dates, licences and tickets, and we'll write the rest. Download as a PDF, no sign-up.";

export const metadata: Metadata = {
  title: "Free CV builder for drivers, warehouse, production and engineering jobs | Reach Network Recruitment",
  description,
  alternates: { canonical: "/cv-builder" },
  ...ogMeta({ title: "A professional CV in 5 minutes. Free.", description, path: "/cv-builder", kicker: "Free CV builder", sub: "Add the basics, we write the rest, you download it free", photo: "warehouse", tag: "100% free" }),
};

export default function CvBuilderPage() {
  return <CvBuilderClient />;
}
