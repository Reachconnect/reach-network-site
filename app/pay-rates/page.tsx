// Pay rate checker and temp cost calculator
import type { Metadata } from "next";
import { ogMeta } from "@/lib/og";
import PayTools from "./PayTools";
import { NLW, getRoleRates } from "@/lib/payRates";
import { SALARY_GUIDE_LIVE } from "@/lib/salaryGuide";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pay rates and temp cost calculator: drivers, warehouse, production | Reach Network Recruitment",
  description: "Typical pay rates for HGV drivers, FLT and warehouse operatives, production staff and engineers, plus a free calculator for the true hourly cost of a worker in 2026/27.",
  alternates: { canonical: "/pay-rates" },
  ...ogMeta({ title: "What should you pay, and what will it really cost?", description: "Typical pay rates and a free true-cost calculator for 2026/27.", path: "/pay-rates", kicker: "Free employer tools", sub: "Pay rate checker and temp cost calculator", tag: "Free tool" }),
};

export default async function PayRatesPage() {
  const rates = await getRoleRates().catch(() => []);
  return <PayTools rates={rates} nlw={NLW} guideLive={SALARY_GUIDE_LIVE} />;
}
