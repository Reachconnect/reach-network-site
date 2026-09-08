import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = 'https://www.reachnetworkrec.com'
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'hello@reachnetworkrec.com'
const STUCK_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

// This runs with the service role key, not a logged-in user's
// session — it's triggered by an external cron/scheduler, not
// someone clicking a button in the dashboard, so there's no admin
// session to authenticate with. Protected instead by CRON_SECRET.
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BATCH_SIZE = 40 // how many emails to send per run of this endpoint

function personalize(text: string, contact: { first_name?: string | null; last_name?: string | null }) {
  return text
    .replace(/\{\{first_name\}\}/g, contact.first_name || 'there')
    .replace(/\{\{last_name\}\}/g, contact.last_name || '')
}

function rewriteLinksForTracking(html: string, trackingId: string) {
  return html.replace(/href="([^"]+)"/g, (match, url) => {
    if (url.startsWith('mailto:') || url.includes('/unsubscribe')) return match
    const trackedUrl = `${SITE_URL}/api/track/click?t=${trackingId}&u=${encodeURIComponent(url)}`
    return `href="${trackedUrl}"`
  })
}

function buildEmailHtml(bodyHtml: string, trackingId: string) {
  const withTrackedLinks = rewriteLinksForTracking(bodyHtml, trackingId)
  const unsubscribeUrl = `${SITE_URL}/unsubscribe?t=${trackingId}`
  const pixelUrl = `${SITE_URL}/api/track/open/${trackingId}`

  return `
    ${withTrackedLinks}
    <hr style="margin-top:32px;border:none;border-top:1px solid #e2e8f0;" />
    <p style="font-size:11px;color:#94a3b8;margin-top:16px;">
      Reach Network Recruitment · [Your business postal address here]<br/>
      You're receiving this because you're a contact of Reach Network Recruitment.
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>
    </p>
    <img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />
  `
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const now = new Date().toISOString()

  // Record that the processor actually ran — this is what lets us
  // tell later if the cron/scheduler triggering this endpoint has
  // stopped firing altogether.
  await supabase.from('queue_heartbeat').upsert({ id: 1, last_run_at: now })

  // Check for campaigns that have been stuck mid-send for over an
  // hour — this catches the case where the processor itself is
  // running fine (so the heartbeat looks healthy) but something
  // else is silently failing on a specific campaign, e.g. Resend
  // rejecting every send for a bad from-address.
  const staleThreshold = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString()

  const { data: sendingCampaigns } = await supabase
    .from('email_campaigns')
    .select('id, name, stuck_alert_sent_at')
    .eq('status', 'sending')

  for (const campaign of sendingCampaigns || []) {
    if (campaign.stuck_alert_sent_at) continue // already alerted, don't spam

    const { data: oldestPending } = await supabase
      .from('email_sends')
      .select('sent_at')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .order('sent_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (oldestPending && oldestPending.sent_at < staleThreshold) {
      try {
        await resend.emails.send({
          from: `Reach Network Alerts <hello@reachnetworkrec.com>`,
          to: ALERT_EMAIL,
          subject: `⚠️ Email campaign "${campaign.name}" appears stuck`,
          html: `<p>The campaign "<b>${campaign.name}</b>" has emails that have been queued for over an hour without sending. Check the Campaigns tab and your scheduler setup.</p>`,
        })
      } catch (err) {
        console.error('Could not send stuck-campaign alert:', err)
      }

      await supabase.from('email_campaigns').update({ stuck_alert_sent_at: now }).eq('id', campaign.id)
    }
  }

  // Step 1: promote any scheduled campaigns whose time has arrived
  // into "sending", and create their pending send rows.
  const { data: dueScheduled } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  for (const campaign of dueScheduled || []) {
    let contactQuery = supabase.from('email_contacts').select('id').eq('unsubscribed', false).eq('bounced', false)
    if (campaign.target_tag) {
      contactQuery = contactQuery.contains('tags', [campaign.target_tag])
    }
    const { data: contacts } = await contactQuery

    if (contacts && contacts.length > 0) {
      const pendingRows = contacts.map((c) => ({
        campaign_id: campaign.id,
        contact_id: c.id,
        tracking_id: crypto.randomUUID(),
        status: 'pending',
      }))
      await supabase.from('email_sends').insert(pendingRows)
    }

    await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaign.id)
  }

  // Step 2: process one batch of pending sends, across whichever
  // campaigns are currently "sending".
  const { data: pendingSends, error: pendingError } = await supabase
    .from('email_sends')
    .select('*, email_campaigns(*), email_contacts(*)')
    .eq('status', 'pending')
    .order('sent_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 })
  }

  let sentCount = 0
  let failedCount = 0

  for (const send of pendingSends || []) {
    const campaign = send.email_campaigns
    const contact = send.email_contacts

    if (!campaign || !contact) {
      await supabase.from('email_sends').update({ status: 'failed', error_message: 'Missing campaign or contact' }).eq('id', send.id)
      failedCount++
      continue
    }

    try {
      const personalizedSubject = personalize(campaign.subject, contact)
      const personalizedBody = personalize(campaign.body_html, contact)

      await resend.emails.send({
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: contact.email,
        replyTo: campaign.reply_to || undefined,
        subject: personalizedSubject,
        html: buildEmailHtml(personalizedBody, send.tracking_id),
      })

      await supabase.from('email_sends').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', send.id)
      sentCount++
    } catch (err: any) {
      await supabase
        .from('email_sends')
        .update({ status: 'failed', error_message: err?.message || 'Unknown error' })
        .eq('id', send.id)
      failedCount++
    }
  }

  // Step 3: mark any campaign as fully "sent" once it has no more
  // pending rows left.
  const campaignIdsThisBatch = [...new Set((pendingSends || []).map((s) => s.campaign_id))]

  for (const campaignId of campaignIdsThisBatch) {
    const { count } = await supabase
      .from('email_sends')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (count === 0) {
      await supabase
        .from('email_campaigns')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', campaignId)
    }
  }

  return NextResponse.json({
    processed: (pendingSends || []).length,
    sentCount,
    failedCount,
    scheduledCampaignsPromoted: (dueScheduled || []).length,
  })
}