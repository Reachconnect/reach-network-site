import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const SITE_URL = 'https://www.reachnetworkrec.com'

export async function POST(request: NextRequest) {
  try {
    const { candidateName, candidateEmail, message } = await request.json()

    if (!candidateName || !candidateEmail) {
      return NextResponse.json({ error: 'Missing candidate name or email' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: docRequest, error } = await supabase
      .from('document_requests')
      .insert({
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        message: message || null,
        request_token: crypto.randomUUID(),
      })
      .select()
      .single()

    if (error) throw error

    const uploadUrl = `${SITE_URL}/upload-documents/${docRequest.request_token}`

    await resend.emails.send({
      from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
      to: candidateEmail,
      subject: 'Please upload your documents — Reach Network Recruitment',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#0F2438;padding:20px;border-radius:12px 12px 0 0;">
            <span style="color:#ffffff;font-weight:bold;font-size:18px;">REACH</span><span style="color:#F7931E;font-weight:bold;font-size:18px;">NETWORK</span>
          </div>
          <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <h2 style="color:#0F2438;margin-top:0;">Hi ${candidateName},</h2>
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              ${
                message
                  ? message
                  : "To move things forward, we just need a few documents from you. It's quick and secure — just photos or scans, uploaded straight from your phone or computer."
              }
            </p>
            <a href="${uploadUrl}" style="display:inline-block;background:#F7931E;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">
              Upload My Documents
            </a>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
              If the button doesn't work, copy this link: ${uploadUrl}
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, requestId: docRequest.id })
  } catch (err: any) {
    console.error('Send document request error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}