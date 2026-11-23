// "How did we do?" page to send to clients and workers
import type { Metadata } from "next";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import ReviewClient from "./ReviewClient";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = { title: "How did we do? | Reach Network Recruitment", robots: { index: false } };

export default function ReviewPage() {
  return (
    <main className="overflow-x-hidden font-body">
      <SiteHeader />
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-orange">Your feedback</p>
          <h1 className="mt-3 text-center font-display text-4xl font-extrabold text-navy sm:text-5xl">How did we do?</h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-slate-600">Thanks for working with Reach. We&apos;d love to hear how it went.</p>
          <div className="mt-10">
            <ReviewClient googleUrl={SITE.googleReviewUrl} />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
