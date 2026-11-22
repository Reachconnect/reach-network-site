// Talking to /api/crm/mail from the CRM screens
import { supabase } from "@/lib/supabase";

export async function mail(method: "GET" | "POST", bodyOrQuery?: object | string) {
  const { data } = await supabase.auth.getSession();
  const query = method === "GET" && typeof bodyOrQuery === "string" ? bodyOrQuery : "";
  const res = await fetch(`/api/crm/mail${query}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: method === "POST" ? JSON.stringify(bodyOrQuery) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Something went wrong.");
  return json;
}

export async function uploadMailFile(kind: "image" | "file", file: File) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const { bucket, path, token, url } = await mail("POST", { action: "upload", kind, ext });
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType: file.type || undefined });
  if (error) throw new Error(`The upload didn't work: ${error.message}`);
  return { path: path as string, url: url as string | null };
}

export const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}%` : "0%");

export type Stats = { total: number; sent: number; pending: number; failed: number; opened: number; clicked: number; unsubscribed: number };
