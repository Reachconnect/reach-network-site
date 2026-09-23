import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, datetime, type, address, link } = await request.json()

    if (!assignmentId || !datetime || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (type === 'in_person' && !address) {
      return NextResponse.json({ error: 'Address is required for an in-person interview' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: assignment, error: assignmentError } = await supabase
      .from('vacancy_assignments')
      .select('*, candidates(*), vacancies(*, clients(*))')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const candidate = assignment.candidates
    const vacancy = assignment.vacancies
    const client = vacancy?.clients

    if (!candidate?.email) {
      return NextResponse.json({ error: 'This candidate has no email address on file' }, { status: 400 })
    }

    await supabase
      .from('vacancy_assignments')
      .update({
        stage: 'interview',
        interview_datetime: datetime,
        interview_type: type,
        interview_address: type === 'in_person' ? address : null,
        interview_link: type === 'teams' ? link || null : null,
        follow_up_sent: false,
        stage_updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    const interviewDate = new Date(datetime).toLocaleString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })

    const locationHtml =
      type === 'in_person'
        ? `<p style="color:#334155;font-size:15px;"><b>Location:</b> ${address}</p>`
        : `<p style="color:#334155;font-size:15px;"><b>This will be a Microsoft Teams call.</b>${link ? ` Join link: <a href="${link}">${link}</a>` : ' The link will follow separately.'}</p>`

    await resend.emails.send({
      from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
      to: candidate.email,
      subject: `Interview confirmed: ${vacancy?.title || 'your application'}${client ? ` at ${client.company_name}` : ''}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="color:#0F2438;">Your interview is confirmed</h2>
          <p style="color:#334155;font-size:15px;line-height:1.6;">
            Hi ${candidate.first_name || ''},<br/><br/>
            Your interview for <b>${vacancy?.title || 'the role'}</b>${client ? ` with ${client.company_name}` : ''} has been arranged.
          </p>
          <p style="color:#334155;font-size:15px;"><b>Date &amp; time:</b> ${interviewDate}</p>
          ${locationHtml}
          <p style="color:#94a3b8;font-size:13px;margin-top:24px;">
            If you have any questions or need to reschedule, just reply to this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Schedule interview error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}