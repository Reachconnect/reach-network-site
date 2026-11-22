import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Resend signs webhooks using the Svix scheme. This verifies that
// the request genuinely came from Resend and wasn't forged by
// someone hitting this URL directly.
function verifySignature(payload: string, headers: Headers, secret: string): boolean {
  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')
  if (!svixId || !svixTimestamp || !svixSignature) return false

  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64')
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`
  const expectedSignature = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')

  return svixSignature
    .split(' ')
    .map((s) => s.split(',')[1])
    .some((sig) => sig === expectedSignature)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    const valid = verifySignature(rawBody, request.headers, webhookSecret)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const event = JSON.parse(rawBody)
  const supabase = getServiceClient()

  const emailAddress = event?.data?.to?.[0]
  if (!emailAddress) {
    return NextResponse.json({ received: true })
  }

  if (event.type === 'email.bounced') {
    await supabase.from('email_contacts').update({ bounced: true }).eq('email', emailAddress)
  }

  if (event.type === 'email.complained') {
    // A spam complaint is a hard "never email this person again",
    // stronger than a normal unsubscribe
    await supabase.from('email_contacts').update({ unsubscribed: true, bounced: true }).eq('email', emailAddress)
  }

  return NextResponse.json({ received: true })
}