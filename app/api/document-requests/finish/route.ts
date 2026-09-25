import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ALERT_EMAIL = process.env.ALERT_EMAIL || 'hello@reachnetworkrec.com'

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: docRequest, error } = await supabase
      .from('document_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('request_token', token)
      .select()
      .single()

    if (error || !docRequest) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    const { data: uploads } = await supabase
      .from('document_uploads')
      .select('document_type')
      .eq('request_id', docRequest.id)

    await resend.emails.send({
      from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
      to: ALERT_EMAIL,
      subject: `Documents uploaded: ${docRequest.candidate_name}`,
      html: `
        <p><b>${docRequest.candidate_name}</b> (${docRequest.candidate_email}) has finished uploading their documents — ${
          uploads?.length || 0
        } file(s) submitted.</p>
        <p>Check the Document Requests tab to review them.</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Finish document request error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}