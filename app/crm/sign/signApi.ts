// Talking to /api/crm/sign from the CRM screens
import { supabase } from "@/lib/supabase";

export async function signApi(method: "GET" | "POST", arg?: object | string) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/crm/sign${method === "GET" && typeof arg === "string" ? arg : ""}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: method === "POST" ? JSON.stringify(arg) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export async function uploadPdf(file: File) {
  const { bucket, path, token } = await signApi("POST", { action: "upload" });
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: "application/pdf" });
  if (error) throw new Error(`The upload didn't work: ${error.message}`);
  return path as string;
}

export const STATUS: Record<string, { label: string; tone: string }> = {
  sent: { label: "Waiting to sign", tone: "bg-amber-100 text-amber-800" },
  completed: { label: "Signed", tone: "bg-green-100 text-green-800" },
  declined: { label: "Declined", tone: "bg-red-100 text-red-700" },
  void: { label: "Cancelled", tone: "bg-slate-100 text-slate-500" },
};

export const KINDS: Record<string, string> = { terms: "Terms of business", contract: "Candidate contract", other: "Other" };
