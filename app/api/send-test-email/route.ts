import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function personalizeForTest(text: string) {
  return text.replace(/\{\{first_name\}\}/g, 'Test').replace(/\{\{last_name\}\}/g, 'User')
}

export async function POST(request: NextRequest) {
  try {
    const { toEmail, subject, bodyHtml, fromName, fromEmail, replyTo } = await request.json()

    if (!toEmail || !subject || !bodyHtml) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const testBanner = `
      <div style="background:#fef3c7;color:#92400e;padding:10px 16px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;text-align:center;">
        TEST SEND — personalization tokens show placeholder values, not a real contact's name
      </div>
    `

    await resend.emails.send({
      from: `${fromName || 'Reach Network Recruitment'} <${fromEmail || 'hello@reachnetworkrec.com'}>`,
      to: toEmail,
      replyTo: replyTo || undefined,
      subject: '[TEST] ' + personalizeForTest(subject),
      html: testBanner + personalizeForTest(bodyHtml),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Send test email error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}