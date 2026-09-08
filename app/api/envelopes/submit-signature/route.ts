import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(',')[1]
  return Buffer.from(base64, 'base64')
}

export async function POST(request: NextRequest) {
  try {
    const { token, fieldValues, signatureDataUrl, initialsDataUrl } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data: signer, error: signerError } = await supabase
      .from('esign_signers')
      .select('*')
      .eq('signing_token', token)
      .maybeSingle()

    if (signerError || !signer) {
      return NextResponse.json({ error: 'Invalid signing link' }, { status: 404 })
    }

    if (signer.status === 'signed') {
      return NextResponse.json({ error: 'This document has already been signed by you' }, { status: 400 })
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Upload the signature/initials images, if provided
    let signatureImageUrl: string | null = null
    let initialsImageUrl: string | null = null

    if (signatureDataUrl) {
      const buffer = dataUrlToBuffer(signatureDataUrl)
      const path = `signatures/${signer.id}-signature.png`
      await supabase.storage.from('esign-documents').upload(path, buffer, { contentType: 'image/png', upsert: true })
      const { data } = supabase.storage.from('esign-documents').getPublicUrl(path)
      signatureImageUrl = data.publicUrl
    }

    if (initialsDataUrl) {
      const buffer = dataUrlToBuffer(initialsDataUrl)
      const path = `signatures/${signer.id}-initials.png`
      await supabase.storage.from('esign-documents').upload(path, buffer, { contentType: 'image/png', upsert: true })
      const { data } = supabase.storage.from('esign-documents').getPublicUrl(path)
      initialsImageUrl = data.publicUrl
    }

    // Save each of this signer's text/date field values
    const { data: myFields } = await supabase
      .from('esign_fields')
      .select('*')
      .eq('signer_id', signer.id)

    const today = new Date().toLocaleDateString('en-GB')

    for (const field of myFields || []) {
      let value: string | null = null
      if (field.field_type === 'text') value = fieldValues?.[field.id] || null
      if (field.field_type === 'date') value = today
      if (field.field_type === 'signature') value = 'signed'
      if (field.field_type === 'initials') value = 'initialed'

      await supabase.from('esign_fields').update({ value }).eq('id', field.id)
    }

    // Mark this signer as done
    await supabase
      .from('esign_signers')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        signature_image_url: signatureImageUrl,
        initials_image_url: initialsImageUrl,
      })
      .eq('id', signer.id)

    // Check if every signer on this envelope has now signed
    const { data: allSigners } = await supabase
      .from('esign_signers')
      .select('*')
      .eq('envelope_id', signer.envelope_id)

    const everyoneSigned = (allSigners || []).every((s) => s.status === 'signed' || s.id === signer.id)

    if (everyoneSigned) {
      await finalizeEnvelope(supabase, signer.envelope_id)
    }

    return NextResponse.json({ success: true, completed: everyoneSigned })
  } catch (err: any) {
    console.error('Submit signature error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}

async function finalizeEnvelope(supabase: ReturnType<typeof getServiceClient>, envelopeId: string) {
  const { data: envelope } = await supabase
    .from('esign_envelopes')
    .select('*, esign_documents(*)')
    .eq('id', envelopeId)
    .single()

  if (!envelope) return

  const { data: allSigners } = await supabase.from('esign_signers').select('*').eq('envelope_id', envelopeId)
  const { data: allFields } = await supabase.from('esign_fields').select('*').eq('envelope_id', envelopeId)

  const signersById: Record<string, any> = {}
  for (const s of allSigners || []) signersById[s.id] = s

  // Load the original PDF
  const originalPdfBytes = await fetch(envelope.esign_documents.original_pdf_url).then((r) => r.arrayBuffer())
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const imageCache: Record<string, any> = {}
  async function getEmbeddedImage(url: string) {
    if (imageCache[url]) return imageCache[url]
    const bytes = await fetch(url).then((r) => r.arrayBuffer())
    const image = await pdfDoc.embedPng(bytes)
    imageCache[url] = image
    return image
  }

  for (const field of allFields || []) {
    const signer = signersById[field.signer_id]
    if (!signer) continue

    const page = pdfDoc.getPage(field.page_number - 1)
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()

    const xPoints = (field.x_pct / 100) * pageWidth
    const widthPoints = (field.width_pct / 100) * pageWidth
    const heightPoints = (field.height_pct / 100) * pageHeight
    const yFromTop = (field.y_pct / 100) * pageHeight
    const yPoints = pageHeight - yFromTop - heightPoints

    if (field.field_type === 'signature' && signer.signature_image_url) {
      const image = await getEmbeddedImage(signer.signature_image_url)
      const scale = Math.min(widthPoints / image.width, heightPoints / image.height)
      page.drawImage(image, {
        x: xPoints,
        y: yPoints,
        width: image.width * scale,
        height: image.height * scale,
      })
    } else if (field.field_type === 'initials' && signer.initials_image_url) {
      const image = await getEmbeddedImage(signer.initials_image_url)
      const scale = Math.min(widthPoints / image.width, heightPoints / image.height)
      page.drawImage(image, {
        x: xPoints,
        y: yPoints,
        width: image.width * scale,
        height: image.height * scale,
      })
    } else if (field.value) {
      page.drawText(field.value, {
        x: xPoints + 2,
        y: yPoints + heightPoints / 4,
        size: 11,
        font,
        color: rgb(0.06, 0.14, 0.22),
      })
    }
  }

  // Append a certificate of completion page — this is the audit
  // trail that gives the signed document real legal weight
  const certPage = pdfDoc.addPage()
  const { width, height } = certPage.getSize()
  let y = height - 60

  certPage.drawText('Certificate of Completion', { x: 50, y, size: 18, font, color: rgb(0.06, 0.14, 0.22) })
  y -= 30
  certPage.drawText(envelope.name, { x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) })
  y -= 40

  for (const signer of allSigners || []) {
    certPage.drawText(`${signer.name} (${signer.role_label || 'Signer'})`, { x: 50, y, size: 12, font })
    y -= 18
    certPage.drawText(`Email: ${signer.email}`, { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 16
    certPage.drawText(`Signed: ${new Date(signer.signed_at).toLocaleString('en-GB')}`, {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 16
    certPage.drawText(`IP address: ${signer.ip_address}`, { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) })
    y -= 30
  }

  const finalPdfBytes = await pdfDoc.save()

  const path = `signed/${envelopeId}.pdf`
  await supabase.storage.from('esign-documents').upload(path, Buffer.from(finalPdfBytes), {
    contentType: 'application/pdf',
    upsert: true,
  })
  const { data: publicUrlData } = supabase.storage.from('esign-documents').getPublicUrl(path)

  await supabase
    .from('esign_envelopes')
    .update({ status: 'completed', completed_at: new Date().toISOString(), final_pdf_url: publicUrlData.publicUrl })
    .eq('id', envelopeId)

  for (const signer of allSigners || []) {
    await resend.emails.send({
      from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
      to: signer.email,
      subject: `Fully signed: ${envelope.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="color:#0F2438;">Everyone has signed</h2>
          <p style="color:#334155;font-size:15px;line-height:1.6;">
            "<b>${envelope.name}</b>" has now been signed by everyone involved. Here's your copy:
          </p>
          <a href="${publicUrlData.publicUrl}" style="display:inline-block;background:#F7931E;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">
            Download Signed Document
          </a>
        </div>
      `,
    })
  }
}