import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string | null
    const documentType = formData.get('documentType') as string | null
    const file = formData.get('file') as File | null

    if (!token || !documentType || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: docRequest, error: requestError } = await supabase
      .from('document_requests')
      .select('*')
      .eq('request_token', token)
      .maybeSingle()

    if (requestError || !docRequest) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    const bytes = await file.arrayBuffer()
    const extension = file.name.split('.').pop() || 'jpg'
    const path = `${docRequest.id}/${documentType}-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('candidate-documents')
      .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('document_uploads').insert({
      request_id: docRequest.id,
      document_type: documentType,
      file_path: path,
      file_name: file.name,
    })

    if (insertError) throw insertError

    if (docRequest.status === 'pending') {
      await supabase.from('document_requests').update({ status: 'in_progress' }).eq('id', docRequest.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Document upload error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}