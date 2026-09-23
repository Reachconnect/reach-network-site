import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { emails, subject, body } = await request.json()

    if (!Array.isArray(emails) || emails.length === 0 || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let sentCount = 0
    let failedCount = 0

    for (const email of emails) {
      try {
        await resend.emails.send({
          from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
          to: email,
          subject,
          html: body.replace(/\n/g, '<br/>'),
        })
        sentCount++
      } catch (err) {
        console.error('Bulk email send failed for', email, err)
        failedCount++
      }
    }

    return NextResponse.json({ sentCount, failedCount })
  } catch (err: any) {
    console.error('Bulk email error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}