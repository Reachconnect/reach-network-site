// Server-only helpers for the CRM's API routes
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Full-access database client (server only). Created on first use.
export function admin() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase server settings are missing.");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

// Only logged-in Reach agency staff may use the CRM's API routes
export async function requireAgency(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  if (!data.user) return null;
  const { data: staff } = await admin().from("agency_users").select("id").eq("user_id", data.user.id).maybeSingle();
  return staff ? data.user.id : null;
}

// 07123 456789 / +44 7123 456789 / 447123456789 → 447123456789
export function normalizeUkPhone(raw: string | null | undefined) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = `44${d.slice(1)}`;
  if (d.length === 10 && d.startsWith("7")) d = `44${d}`;
  return d;
}

export const GRAPH = "https://graph.facebook.com/v21.0";
export const DAILY_LIMIT = 250;

export function whatsappConfig() {
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  };
}

// Swap {first_name} for each person's first name
export function fillVariables(variables: string[], firstName: string | null) {
  return variables.map((v) => v.replaceAll("{first_name}", (firstName || "").trim() || "there").trim());
}

export function renderBody(body: string, values: string[]) {
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => values[Number(n) - 1] ?? "");
}