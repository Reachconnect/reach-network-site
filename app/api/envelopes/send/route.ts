import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = 'https://www.reachnetworkrec.com'

export async function POST(request: NextRequest) {
  try {
    const { envelopeId } = await request.json()
    if (!envelopeId) {
      return NextResponse.json({ error: 'Missing envelopeId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: envelope, error: envelopeError } = await supabase
      .from('esign_envelopes')
      .select('*')
      .eq('id', envelopeId)
      .single()

    if (envelopeError || !envelope) {
      return NextResponse.json({ error: 'Envelope not found' }, { status: 404 })
    }

    const { data: signers, error: signersError } = await supabase
      .from('esign_signers')
      .select('*')
      .eq('envelope_id', envelopeId)
      .neq('status', 'signed')

    if (signersError) {
      return NextResponse.json({ error: signersError.message }, { status: 500 })
    }

    for (const signer of signers || []) {
      const signingUrl = `${SITE_URL}/sign/${signer.signing_token}`

      await resend.emails.send({
        from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
        to: signer.email,
        subject: `Please sign: ${envelope.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="color:#0F2438;">Your signature is needed</h2>
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Hi ${signer.name},<br/><br/>
              Reach Network Recruitment has sent you "<b>${envelope.name}</b>" to review and sign.
            </p>
            <a href="${signingUrl}" style="display:inline-block;background:#F7931E;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">
              Review &amp; Sign
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
              If the button doesn't work, copy this link: ${signingUrl}
            </p>
          </div>
        `,
      })
    }

    if (envelope.status === 'draft') {
      await supabase
        .from('esign_envelopes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', envelopeId)
    }

    return NextResponse.json({ sentTo: (signers || []).length })
  } catch (err: any) {
    console.error('Send envelope error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}