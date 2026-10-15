"use client";
import { useState } from "react";
import { rewardsApi } from "@/lib/useRewardsUser";

export default function ImportAwinButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function run() {
    setBusy(true);
    setMessage(null);
    setWarning(null);
    setIsError(false);
    try {
      const r = await rewardsApi("/api/rewards/import-awin", {});
      setMessage(
        `Checked ${r.checked} Awin offers: ${r.added} new, ${r.updated} updated, ${r.removed} removed. ` +
          `Logos found for ${r.logos} of ${r.companies} companies.`
      );
      if (r.logoProblem) setWarning(r.logoProblem);
      onDone();
    } catch (e) {
      setIsError(true);
      setMessage((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-[#0F2438]">Awin codes</p>
        <p className="text-sm text-slate-600">
          Imported automatically every night. Use the button to pull new ones in now.
        </p>
        {message && (
          <p className={`mt-2 text-sm font-medium ${isError ? "text-red-600" : "text-green-700"}`}>{message}</p>
        )}
        {warning && <p className="mt-1 text-sm font-medium text-[#b8660b]">{warning}</p>}
      </div>
      <button
        onClick={run}
        disabled={busy}
        className="flex-shrink-0 rounded-lg bg-[#0F2438] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a3552] disabled:opacity-60"
      >
        {busy ? "Importing…" : "Import from Awin now"}
      </button>
    </div>
  );
}