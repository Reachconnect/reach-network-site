"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icons";

// Example offers for illustration only. No real brands.
const OFFERS = [
  { letter: "H", bg: "#0F2438", retailer: "High street fashion", tag: "Shopping", title: "15% off full-price items" },
  { letter: "C", bg: "#1F7A4D", retailer: "Local café", tag: "Local", title: "Free hot drink with any breakfast" },
  { letter: "C", bg: "#111827", retailer: "Cinema chain", tag: "Days out", title: "2 tickets for £12" },
  { letter: "S", bg: "#2563EB", retailer: "Supermarket", tag: "Groceries", title: "£5 off a £50 shop" },
  { letter: "F", bg: "#B91C1C", retailer: "Fuel station", tag: "Motoring", title: "5p off every litre" },
  { letter: "T", bg: "#F7931E", retailer: "Takeaway app", tag: "Food & drink", title: "£10 off your first order" },
  { letter: "G", bg: "#7C3AED", retailer: "Local gym", tag: "Health & fitness", title: "No joining fee this month" },
  { letter: "W", bg: "#374151", retailer: "Workwear store", tag: "Shopping", title: "20% off safety boots" },
  { letter: "P", bg: "#DB2777", retailer: "Theme park", tag: "Days out", title: "Up to 30% off tickets" },
  { letter: "M", bg: "#0E7490", retailer: "Local garage", tag: "Local", title: "£20 off your MOT and service" },
];

export default function RotatingOffers() {
  // Which offer is showing in each of the 3 slots
  const [slots, setSlots] = useState([0, 1, 2]);
  const next = useRef(3);
  const tick = useRef(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      const slot = tick.current % 3;
      const offer = next.current % OFFERS.length;
      setSlots((s) => s.map((v, i) => (i === slot ? offer : v)));
      next.current += 1;
      tick.current += 1;
    }, 2200);

    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <style>{`
        @keyframes rrCardIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rr-card-in { animation: rrCardIn 450ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rr-card-in { animation: none; } }
      `}</style>

      <div className="space-y-3 md:-rotate-3" aria-live="polite">
        {slots.map((offerIndex, slot) => {
          const o = OFFERS[offerIndex];
          return (
            <div key={slot} className={slot === 1 ? "md:-ml-4" : "md:ml-4"}>
              <div
                key={`${slot}-${offerIndex}`}
                className="rr-card-in flex items-center gap-3 rounded-2xl bg-white p-3.5 text-[#0F2438] shadow-xl sm:gap-4 sm:p-4"
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
                  style={{ backgroundColor: o.bg }}
                >
                  {o.letter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-500">
                    {o.retailer} | {o.tag}
                  </p>
                  <p className="font-bold leading-snug">{o.title}</p>
                </div>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#F7931E] text-white">
                  <Icon name="arrow" className="h-4 w-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-right text-[11px] text-white/50">Example offers for illustration</p>
    </div>
  );
}