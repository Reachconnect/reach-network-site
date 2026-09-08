import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { campaignId, scheduledAt } = await request.json()
    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isScheduledForLater = scheduledAt && new Date(scheduledAt) > new Date()

    if (isScheduledForLater) {
      // Don't create the send rows yet — the queue processor will
      // do that once the scheduled time actually arrives, so the
      // audience is picked up fresh (e.g. someone who unsubscribes
      // between now and then is correctly excluded).
      await supabase
        .from('email_campaigns')
        .update({ status: 'scheduled', scheduled_at: scheduledAt })
        .eq('id', campaignId)

      return NextResponse.json({ scheduled: true, scheduledAt })
    }

    let contactQuery = supabase.from('email_contacts').select('id').eq('unsubscribed', false).eq('bounced', false)
    if (campaign.target_tag) {
      contactQuery = contactQuery.contains('tags', [campaign.target_tag])
    }
    const { data: contacts, error: contactsError } = await contactQuery

    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 500 })
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No matching contacts to send to' }, { status: 400 })
    }

    const pendingRows = contacts.map((c) => ({
      campaign_id: campaignId,
      contact_id: c.id,
      tracking_id: crypto.randomUUID(),
      status: 'pending',
    }))

    // Insert in chunks so this stays fast even for very large lists
    const chunkSize = 1000
    for (let i = 0; i < pendingRows.length; i += chunkSize) {
      const { error: insertError } = await supabase.from('email_sends').insert(pendingRows.slice(i, i + chunkSize))
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    await supabase
      .from('email_campaigns')
      .update({ status: 'sending', scheduled_at: new Date().toISOString() })
      .eq('id', campaignId)

    return NextResponse.json({ queued: true, totalContacts: contacts.length })
  } catch (err: any) {
    console.error('Queue campaign error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}