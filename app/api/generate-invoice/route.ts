import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { clientId, assignmentIds, billingEmail } = await request.json()

    if (!clientId || !Array.isArray(assignmentIds) || assignmentIds.length === 0 || !billingEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()
    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: assignments, error: assignmentsError } = await supabase
      .from('vacancy_assignments')
      .select('*, candidates(first_name, last_name), vacancies(title)')
      .in('id', assignmentIds)
    if (assignmentsError || !assignments || assignments.length === 0) {
      return NextResponse.json({ error: 'No matching placements found' }, { status: 404 })
    }

    const lineItems = assignments.map((a: any) => ({
      assignment_id: a.id,
      description: `${a.candidates?.first_name || ''} ${a.candidates?.last_name || ''} — ${a.vacancies?.title || 'Placement'}`.trim(),
      amount: Number(a.fee_amount || 0),
    }))
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)

    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const invoiceDate = new Date().toISOString().slice(0, 10)
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    // Build the PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const navy = rgb(0.06, 0.14, 0.22)
    const orange = rgb(0.97, 0.58, 0.12)
    const grey = rgb(0.4, 0.45, 0.5)

    let y = 780

    page.drawText('REACH', { x: 50, y, size: 22, font: boldFont, color: navy })
    page.drawText('NETWORK', { x: 130, y, size: 22, font: boldFont, color: orange })
    y -= 40

    page.drawText('INVOICE', { x: 50, y, size: 16, font: boldFont, color: navy })
    page.drawText(invoiceNumber, { x: 450, y, size: 11, font, color: grey })
    y -= 20
    page.drawText(`Date: ${invoiceDate}`, { x: 450, y, size: 10, font, color: grey })
    y -= 14
    page.drawText(`Due: ${dueDate}`, { x: 450, y, size: 10, font, color: grey })
    y -= 40

    page.drawText('Billed to:', { x: 50, y, size: 10, font, color: grey })
    y -= 16
    page.drawText(client.company_name, { x: 50, y, size: 13, font: boldFont, color: navy })
    y -= 16
    page.drawText(billingEmail, { x: 50, y, size: 10, font, color: grey })
    y -= 40

    // Table header
    page.drawText('Description', { x: 50, y, size: 10, font: boldFont, color: navy })
    page.drawText('Amount', { x: 480, y, size: 10, font: boldFont, color: navy })
    y -= 6
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
    y -= 20

    for (const item of lineItems) {
      page.drawText(item.description, { x: 50, y, size: 10, font, color: navy, maxWidth: 400 })
      page.drawText(`£${item.amount.toFixed(2)}`, { x: 480, y, size: 10, font, color: navy })
      y -= 22
    }

    y -= 10
    page.drawLine({ start: { x: 350, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
    y -= 20
    page.drawText('Total', { x: 400, y, size: 12, font: boldFont, color: navy })
    page.drawText(`£${totalAmount.toFixed(2)}`, { x: 480, y, size: 12, font: boldFont, color: navy })

    y -= 60
    page.drawText('Payable within 30 days of invoice. Thank you for your business.', {
      x: 50,
      y,
      size: 9,
      font,
      color: grey,
    })

    const pdfBytes = await pdfDoc.save()

    const path = `invoices/${invoiceNumber}.pdf`
    await supabase.storage.from('invoices').upload(path, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
    })

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        client_id: clientId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status: 'sent',
        billing_email: billingEmail,
        pdf_url: path,
        total_amount: totalAmount,
      })
      .select()
      .single()
    if (invoiceError) throw invoiceError

    await supabase.from('invoice_line_items').insert(
      lineItems.map((item) => ({ ...item, invoice_id: invoice.id }))
    )

    await supabase.from('vacancy_assignments').update({ fee_status: 'invoiced' }).in('id', assignmentIds)

    await resend.emails.send({
      from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
      to: billingEmail,
      subject: `Invoice ${invoiceNumber} from Reach Network Recruitment`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <h2 style="color:#0F2438;">Invoice ${invoiceNumber}</h2>
          <p style="color:#334155;font-size:15px;line-height:1.6;">
            Please find attached invoice ${invoiceNumber} for ${client.company_name}, totalling £${totalAmount.toFixed(2)}, due ${dueDate}.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: Buffer.from(pdfBytes).toString('base64'),
        },
      ],
    })

    return NextResponse.json({ success: true, invoiceNumber, totalAmount })
  } catch (err: any) {
    console.error('Generate invoice error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}