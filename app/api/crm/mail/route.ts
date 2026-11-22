// /api/crm/mail: email campaigns from the CRM (agency staff only)
//
// GET ?view=overview            lists and campaigns with their numbers
// GET ?view=list&id=            one list and its contacts
// GET ?view=campaign&id=        one campaign, who it went to, who opened and clicked
//
// POST actions:
//   list_create {name, description}      list_rename {id, name, description}   list_delete {id}
//   import {listId, contacts: [...]}     contact_delete {id}                    import_old
//   upload {kind: image|file, ext}       campaign_save {...}                    campaign_delete {id}
//   test {id, to}                        start {id}                             send_chunk {id}
//   stop {id}                            resume {id}
import { NextResponse } from "next/server";
import { admin, requireAgency } from "@/lib/crmServer";
import { newToken } from "@/lib/specs";
import { DAILY_LIMIT, EMAIL_RE, MAIL_FILES_BUCKET, buildEmail, sendBatch, sendOne, type CampaignContent, type Recipient } from "@/lib/mail";
import { PUBLIC_BUCKET, formatDuration, publicUrl, watchUrl } from "@/lib/videos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHUNK = 50;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const safePath = (v: unknown) => (typeof v === "string" && /^[\w\-./]+$/.test(v) && !v.includes("..") ? v : null);
type DB = ReturnType<typeof admin>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function content(db: DB, c: any): Promise<CampaignContent> {
  let video: CampaignContent["video"] = null;
  if (c.video_id) {
    const { data: v } = await db.from("crm_videos").select("*").eq("id", c.video_id).eq("deleted", false).maybeSingle();
    if (v) video = { link: watchUrl(v.token), gif_url: publicUrl(v.gif_path), thumb_url: publicUrl(v.thumb_path), title: v.title, duration: formatDuration(v.duration_seconds) };
  }
  return {
    subject: c.subject || "",
    preheader: c.preheader || null,
    body: c.body || "",
    image_url: publicUrl(c.image_path),
    button_text: c.button_text || null,
    button_url: c.button_url || null,
    files: Array.isArray(c.files) ? c.files : [],
    video,
  };
}

async function counts(db: DB, campaignId: string) {
  const q = () => db.from("crm_mail_sends").select("id", { count: "exact", head: true }).eq("campaign_id", campaignId);
  const [total, sent, pending, failed, opened, clicked, unsub] = await Promise.all([
    q(),
    q().eq("status", "sent"),
    q().in("status", ["pending", "claimed"]),
    q().eq("status", "failed"),
    q().not("opened_at", "is", null),
    q().not("clicked_at", "is", null),
    q().not("unsubscribed_at", "is", null),
  ]);
  return { total: total.count ?? 0, sent: sent.count ?? 0, pending: pending.count ?? 0, failed: failed.count ?? 0, opened: opened.count ?? 0, clicked: clicked.count ?? 0, unsubscribed: unsub.count ?? 0 };
}

async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function sentToday(db: DB) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await db.from("crm_mail_sends").select("id", { count: "exact", head: true }).gte("sent_at", start.toISOString());
  return count ?? 0;
}

export async function GET(request: Request) {
  if (!(await requireAgency(request))) return fail("Please log in again.", 401);
  const db = admin();
  const url = new URL(request.url);
  const view = url.searchParams.get("view") || "overview";
  const id = url.searchParams.get("id") || "";

  try {
    if (view === "overview") {
      const [{ data: lists, error }, { data: campaigns }, { count: oldCount }, { count: suppressed }] = await Promise.all([
        db.from("crm_mail_lists").select("*").order("created_at", { ascending: false }),
        db.from("crm_mail_campaigns").select("id, name, subject, status, list_id, created_at, started_at, finished_at").order("created_at", { ascending: false }).limit(60),
        db.from("email_contacts").select("id", { count: "exact", head: true }),
        db.from("crm_mail_suppressions").select("email", { count: "exact", head: true }),
      ]);
      if (error) return fail(`${error.message}. Has the email SQL been run?`, 500);
      const listCounts = await Promise.all(
        (lists ?? []).map((l) => db.from("crm_mail_contacts").select("id", { count: "exact", head: true }).eq("list_id", l.id).then((r) => r.count ?? 0))
      );
      const campaignCounts = await Promise.all((campaigns ?? []).map((c) => (c.status === "draft" ? null : counts(db, c.id))));
      return NextResponse.json({
        lists: (lists ?? []).map((l, i) => ({ ...l, contact_count: listCounts[i] })),
        campaigns: (campaigns ?? []).map((c, i) => ({ ...c, stats: campaignCounts[i] })),
        old_contacts: oldCount ?? 0,
        suppressed: suppressed ?? 0,
        sent_today: await sentToday(db),
        daily_limit: DAILY_LIMIT,
      });
    }

    if (view === "list") {
      const { data: list } = await db.from("crm_mail_lists").select("*").eq("id", id).maybeSingle();
      if (!list) return fail("List not found.", 404);
      const contacts = await allRows<Row>((a, b) =>
        db.from("crm_mail_contacts").select("id, email, first_name, last_name, company, job_title, phone, created_at").eq("list_id", id).order("company").range(a, b)
      );
      const emails = new Set<string>();
      for (let i = 0; i < contacts.length; i += 500) {
        const { data } = await db.from("crm_mail_suppressions").select("email").in("email", contacts.slice(i, i + 500).map((c) => c.email));
        (data ?? []).forEach((s) => emails.add(s.email));
      }
      return NextResponse.json({ list, contacts: contacts.map((c) => ({ ...c, unsubscribed: emails.has(c.email) })) });
    }

    if (view === "campaign") {
      const { data: c } = await db.from("crm_mail_campaigns").select("*").eq("id", id).maybeSingle();
      if (!c) return fail("Campaign not found.", 404);
      const [{ data: list }, stats, sends, { data: sample }] = await Promise.all([
        c.list_id ? db.from("crm_mail_lists").select("id, name").eq("id", c.list_id).maybeSingle() : Promise.resolve({ data: null }),
        counts(db, c.id),
        allRows((a, b) =>
          db
            .from("crm_mail_sends")
            .select("id, email, first_name, last_name, company, job_title, phone, status, error, sent_at, opened_at, open_count, clicked_at, click_count, unsubscribed_at, bounced_at")
            .eq("campaign_id", c.id)
            .order("clicked_at", { ascending: false, nullsFirst: false })
            .range(a, b)
        ),
        c.list_id ? db.from("crm_mail_contacts").select("first_name, last_name, company, job_title").eq("list_id", c.list_id).limit(1) : Promise.resolve({ data: [] }),
      ]);
      const clickers = sends.filter((s) => s.clicked_at).map((s) => s.id);
      const clicks: { send_id: string; url: string; clicked_at: string }[] = [];
      for (let i = 0; i < clickers.length; i += 300) {
        const { data } = await db.from("crm_mail_clicks").select("send_id, url, clicked_at").in("send_id", clickers.slice(i, i + 300)).order("clicked_at");
        clicks.push(...(data ?? []));
      }
      const preview = buildEmail(await content(db, c), (sample?.[0] as Recipient) || { first_name: "Sarah", last_name: "Jones", company: "Example Foods Ltd", job_title: "Operations Manager" }, "preview", false);
      return NextResponse.json({
        campaign: { ...c, image_url: publicUrl(c.image_path) },
        list,
        stats,
        sends,
        clicks,
        preview: { subject: preview.subject, html: preview.html },
        sent_today: await sentToday(db),
        daily_limit: DAILY_LIMIT,
      });
    }
  } catch (e) {
    return fail((e as Error).message, 500);
  }
  return fail("Unknown view.");
}

export async function POST(request: Request) {
  const userId = await requireAgency(request);
  if (!userId) return fail("Please log in again.", 401);
  const body = await request.json().catch(() => ({}));
  const db = admin();
  const action = body.action;

  // ---------- Lists ----------
  if (action === "list_create") {
    const name = str(body.name, 120);
    if (!name) return fail("Give the list a name.");
    const { data, error } = await db.from("crm_mail_lists").insert({ name, description: str(body.description, 300) || null, created_by: userId }).select("*").single();
    if (error) return fail(error.message, 500);
    return NextResponse.json({ list: data });
  }
  if (action === "list_rename") {
    await db.from("crm_mail_lists").update({ name: str(body.name, 120) || "List", description: str(body.description, 300) || null }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "list_delete") {
    await db.from("crm_mail_lists").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "contact_delete") {
    await db.from("crm_mail_contacts").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "import") {
    const listId = str(body.listId, 40);
    const raw = Array.isArray(body.contacts) ? body.contacts.slice(0, 1000) : [];
    const seen = new Set<string>();
    let invalid = 0;
    const rows = [];
    for (const c of raw) {
      const email = str(c?.email, 200).toLowerCase();
      if (!EMAIL_RE.test(email)) {
        invalid++;
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);
      rows.push({
        list_id: listId,
        email,
        first_name: str(c.first_name, 80) || null,
        last_name: str(c.last_name, 80) || null,
        company: str(c.company, 160) || null,
        job_title: str(c.job_title, 160) || null,
        phone: str(c.phone, 40) || null,
      });
    }
    if (rows.length) {
      const { error } = await db.from("crm_mail_contacts").upsert(rows, { onConflict: "list_id,email" });
      if (error) return fail(error.message, 500);
    }
    return NextResponse.json({ saved: rows.length, invalid });
  }

  // Brings contacts across from the old admin dashboard: one list per tag
  if (action === "import_old") {
    let old: { email: string; first_name: string | null; last_name: string | null; company: string | null; tags: string[] | null; unsubscribed: boolean; bounced: boolean }[] = [];
    try {
      old = await allRows<Row>((a, b) => db.from("email_contacts").select("email, first_name, last_name, company, tags, unsubscribed, bounced").range(a, b));
    } catch (e) {
      return fail(`Couldn't read the old contacts: ${(e as Error).message}`, 500);
    }
    const groups = new Map<string, typeof old>();
    for (const c of old) {
      const tags: string[] = Array.isArray(c.tags) && c.tags.length ? c.tags : ["no tag"];
      for (const t of tags) groups.set(t, [...(groups.get(t) ?? []), c]);
    }
    let lists = 0;
    let saved = 0;
    for (const [tag, people] of groups) {
      const name = tag === "no tag" ? "Old contacts (no tag)" : `Old: ${tag}`;
      let { data: list } = await db.from("crm_mail_lists").select("id").eq("name", name).maybeSingle();
      if (!list) ({ data: list } = await db.from("crm_mail_lists").insert({ name, description: "Brought across from the old admin dashboard", created_by: userId }).select("id").single());
      if (!list) continue;
      lists++;
      const rows = people
        .filter((p) => EMAIL_RE.test((p.email || "").toLowerCase()))
        .map((p) => ({ list_id: list!.id, email: p.email.toLowerCase(), first_name: p.first_name, last_name: p.last_name, company: p.company }));
      for (let i = 0; i < rows.length; i += 500) {
        await db.from("crm_mail_contacts").upsert(rows.slice(i, i + 500), { onConflict: "list_id,email" });
      }
      saved += rows.length;
    }
    const blocked = old.filter((c) => c.unsubscribed || c.bounced).map((c) => ({ email: c.email.toLowerCase(), reason: c.bounced ? "bounced" : "unsubscribed" }));
    for (let i = 0; i < blocked.length; i += 500) {
      await db.from("crm_mail_suppressions").upsert(blocked.slice(i, i + 500), { onConflict: "email", ignoreDuplicates: true });
    }
    return NextResponse.json({ lists, saved, suppressed: blocked.length });
  }

  // ---------- Uploads ----------
  if (action === "upload") {
    const kind = body.kind === "file" ? "file" : "image";
    const ext = String(body.ext || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || "bin";
    const bucket = kind === "file" ? MAIL_FILES_BUCKET : PUBLIC_BUCKET;
    const path = `mail/${kind}s/${new Date().toISOString().slice(0, 10)}/${newToken()}.${ext}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return fail(`Couldn't get ready to upload: ${error?.message || "unknown"}. Have the storage buckets been created?`, 500);
    return NextResponse.json({ bucket, path: data.path, token: data.token, url: kind === "image" ? publicUrl(data.path) : null });
  }

  // ---------- Campaigns ----------
  if (action === "campaign_save") {
    const row = {
      name: str(body.name, 160) || "Untitled campaign",
      list_id: str(body.list_id, 40) || null,
      subject: str(body.subject, 250),
      preheader: str(body.preheader, 250) || null,
      body: typeof body.body === "string" ? body.body.slice(0, 20000) : "",
      image_path: safePath(body.image_path),
      button_text: str(body.button_text, 80) || null,
      button_url: /^https?:\/\//.test(str(body.button_url, 500)) ? str(body.button_url, 500) : null,
      files: (Array.isArray(body.files) ? body.files : [])
        .map((f: { path?: unknown; name?: unknown; size?: unknown }) => ({ path: safePath(f.path), name: str(f.name, 160), size: Number(f.size) || 0 }))
        .filter((f: { path: string | null }) => f.path)
        .slice(0, 10),
      video_id: str(body.video_id, 40) || null,
      alert_on_click: body.alert_on_click !== false,
      updated_at: new Date().toISOString(),
    };
    if (body.id) {
      const { data: existing } = await db.from("crm_mail_campaigns").select("status").eq("id", body.id).maybeSingle();
      if (!existing) return fail("Campaign not found.", 404);
      if (existing.status !== "draft") return fail("This campaign has already been sent, so it can't be changed. Make a copy instead.");
      const { error } = await db.from("crm_mail_campaigns").update(row).eq("id", body.id);
      if (error) return fail(error.message, 500);
      return NextResponse.json({ id: body.id });
    }
    const { data, error } = await db.from("crm_mail_campaigns").insert({ ...row, status: "draft", created_by: userId }).select("id").single();
    if (error) return fail(error.message, 500);
    return NextResponse.json({ id: data.id });
  }

  if (action === "campaign_delete") {
    await db.from("crm_mail_campaigns").delete().eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  const { data: c } = body.id ? await db.from("crm_mail_campaigns").select("*").eq("id", body.id).maybeSingle() : { data: null };
  if (!c) return fail("Campaign not found.", 404);

  if (action === "test") {
    const to = str(body.to, 200).toLowerCase();
    if (!EMAIL_RE.test(to)) return fail("Enter the email address to send the test to.");
    const { data: sample } = c.list_id ? await db.from("crm_mail_contacts").select("first_name, last_name, company, job_title").eq("list_id", c.list_id).limit(1) : { data: [] };
    const r = (sample?.[0] as Recipient) || { first_name: "Sarah", last_name: "Jones", company: "Example Foods Ltd", job_title: "Operations Manager" };
    const e = buildEmail(await content(db, c), r, "test", false);
    const out = await sendOne(to, { ...e, subject: `[Test] ${e.subject}` });
    if (!out.ok) return fail(out.error || "The test didn't send.", 502);
    return NextResponse.json({ ok: true, as: r });
  }

  if (action === "start") {
    if (c.status !== "draft") return fail("This campaign has already been started.");
    if (!c.list_id) return fail("Choose which list to send it to.");
    if (!c.subject || !c.body.trim()) return fail("The email needs a subject and a message.");
    const contacts = await allRows<Row>((a, b) => db.from("crm_mail_contacts").select("id, email, first_name, last_name, company, job_title, phone").eq("list_id", c.list_id).range(a, b));
    if (!contacts.length) return fail("That list has nobody in it yet.");
    const blocked = new Set<string>();
    for (let i = 0; i < contacts.length; i += 500) {
      const { data } = await db.from("crm_mail_suppressions").select("email").in("email", contacts.slice(i, i + 500).map((x) => x.email));
      (data ?? []).forEach((s) => blocked.add(s.email));
    }
    const rows = contacts.map((x) => ({
      campaign_id: c.id,
      contact_id: x.id,
      email: x.email,
      first_name: x.first_name,
      last_name: x.last_name,
      company: x.company,
      job_title: x.job_title,
      phone: x.phone,
      token: newToken(),
      status: blocked.has(x.email) ? "skipped" : "pending",
      error: blocked.has(x.email) ? "Unsubscribed or bounced before" : null,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await db.from("crm_mail_sends").insert(rows.slice(i, i + 500));
      if (error) return fail(`Couldn't queue the emails: ${error.message}`, 500);
    }
    await db.from("crm_mail_campaigns").update({ status: "sending", started_at: new Date().toISOString() }).eq("id", c.id);
    return NextResponse.json({ queued: rows.length - blocked.size, skipped: blocked.size });
  }

  if (action === "stop") {
    await db.from("crm_mail_campaigns").update({ status: "stopped" }).eq("id", c.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "retry_failed") {
    await db.from("crm_mail_sends").update({ status: "pending", error: null }).eq("campaign_id", c.id).eq("status", "failed");
    await db.from("crm_mail_campaigns").update({ status: "sending" }).eq("id", c.id);
    return NextResponse.json({ ok: true });
  }
  if (action === "resume") {
    await db.from("crm_mail_campaigns").update({ status: "sending" }).eq("id", c.id);
    return NextResponse.json({ ok: true });
  }

  if (action === "send_chunk") {
    if (c.status !== "sending") return NextResponse.json({ done: c.status === "sent", stopped: c.status === "stopped", ...(await counts(db, c.id)) });

    // Anything claimed by a request that never finished goes back in the queue
    await db
      .from("crm_mail_sends")
      .update({ status: "pending", claimed_at: null })
      .eq("campaign_id", c.id)
      .eq("status", "claimed")
      .lt("claimed_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    const allowance = Math.max(0, DAILY_LIMIT - (await sentToday(db)));
    if (!allowance) return NextResponse.json({ limit: true, ...(await counts(db, c.id)) });

    const { data: next } = await db.from("crm_mail_sends").select("id").eq("campaign_id", c.id).eq("status", "pending").limit(Math.min(CHUNK, allowance));
    if (!next?.length) {
      const stats = await counts(db, c.id);
      if (!stats.pending) {
        await db.from("crm_mail_campaigns").update({ status: "sent", finished_at: new Date().toISOString() }).eq("id", c.id);
        return NextResponse.json({ done: true, ...stats });
      }
      return NextResponse.json({ ...stats });
    }
    const { data: claimed } = await db
      .from("crm_mail_sends")
      .update({ status: "claimed", claimed_at: new Date().toISOString() })
      .in("id", next.map((n) => n.id))
      .eq("status", "pending")
      .select("*");
    const batch = claimed ?? [];
    if (batch.length) {
      // Someone may have unsubscribed from another campaign since this was queued
      const { data: sup } = await db.from("crm_mail_suppressions").select("email").in("email", batch.map((b) => b.email));
      const blocked = new Set((sup ?? []).map((s) => s.email));
      const go = batch.filter((b) => !blocked.has(b.email));
      if (blocked.size) {
        await db.from("crm_mail_sends").update({ status: "skipped", error: "Unsubscribed or bounced" }).in("id", batch.filter((b) => blocked.has(b.email)).map((b) => b.id));
      }
      if (go.length) {
        const cc = await content(db, c);
        const emails = go.map((s) => ({ to: s.email, ...buildEmail(cc, s, s.token, true) }));
        const out = await sendBatch(emails);
        const now = new Date().toISOString();
        if (out.ok) {
          await Promise.all(go.map((s, i) => db.from("crm_mail_sends").update({ status: "sent", sent_at: now, resend_id: out.ids[i] || null, error: null }).eq("id", s.id)));
        } else if (/rate|too many|429|limit/i.test(out.error || "")) {
          await db.from("crm_mail_sends").update({ status: "pending", claimed_at: null }).in("id", go.map((s) => s.id));
          return NextResponse.json({ wait: true, error: out.error, ...(await counts(db, c.id)) });
        } else {
          await db.from("crm_mail_sends").update({ status: "failed", error: out.error }).in("id", go.map((s) => s.id));
          return NextResponse.json({ error: out.error, ...(await counts(db, c.id)) });
        }
      }
    }
    return NextResponse.json({ ...(await counts(db, c.id)) });
  }

  return fail("Unknown action.");
}
