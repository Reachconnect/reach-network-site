"use client";

// Lets a visitor change their cookie choice
export default function CookieSettingsButton() {
  return (
    <button
      onClick={() => {
        try {
          localStorage.removeItem("rnr_consent");
        } catch {
          // fine
        }
        document.cookie = "rnr_vid=; path=/; max-age=0";
        window.dispatchEvent(new Event("rnr-cookie-settings"));
      }}
      className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
    >
      Change my cookie choice
    </button>
  );
}
