import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NAVY = rgb(0.06, 0.14, 0.22)
const ORANGE = rgb(0.97, 0.58, 0.12)
const GREY = rgb(0.42, 0.47, 0.52)
const LIGHT_GREY = rgb(0.85, 0.86, 0.88)

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = (text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

// Splits the freeform body text into sections by "## Heading"
// markers, matching what the editor's live preview does — this is
// what actually turns the recruiter's edited plain text into a
// properly laid-out PDF.
function parseSections(body: string) {
  const lines = (body || '').split('\n')
  const sections: { heading: string; text: string }[] = []
  let current: { heading: string; text: string } | null = null

  for (const line of lines) {
    if (line.trim().startsWith('## ')) {
      current = { heading: line.trim().slice(3).trim(), text: '' }
      sections.push(current)
    } else if (current) {
      current.text += line + '\n'
    }
  }

  return sections.map((s) => ({ heading: s.heading, text: s.text.trim() }))
}

function splitParagraphs(sectionText: string) {
  return sectionText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export async function POST(request: NextRequest) {
  try {
    const { candidateId, cvData, sendToEmail } = await request.json()

    if (!candidateId || !cvData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Save the edited content back to the candidate record so it
    // can be reopened and edited again later without re-parsing
    await supabase.from('candidates').update({ formatted_cv: cvData }).eq('id', candidateId)

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y = PAGE_HEIGHT - 60

    function newPage() {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - 60
    }

    function ensureSpace(neededHeight: number) {
      if (y - neededHeight < MARGIN) {
        newPage()
      }
    }

    function drawLine(text: string, size: number, useFont: PDFFont, color = NAVY, lineGap = 4) {
      if (text.trim() === '') {
        y -= size + lineGap
        return
      }
      const wrapped = wrapText(text, useFont, size, CONTENT_WIDTH)
      for (const line of wrapped) {
        ensureSpace(size + lineGap)
        page.drawText(line, { x: MARGIN, y, size, font: useFont, color })
        y -= size + lineGap
      }
    }

    function sectionHeading(label: string) {
      ensureSpace(30)
      y -= 10
      page.drawText(label.toUpperCase(), { x: MARGIN, y, size: 11, font: boldFont, color: ORANGE })
      y -= 6
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_WIDTH - MARGIN, y },
        thickness: 1,
        color: LIGHT_GREY,
      })
      y -= 18
    }

    // Header
    page.drawText('REACH', { x: MARGIN, y, size: 12, font: boldFont, color: NAVY })
    page.drawText('NETWORK', { x: MARGIN + 42, y, size: 12, font: boldFont, color: ORANGE })
    y -= 36

    page.drawText(cvData.name || 'Candidate Profile', { x: MARGIN, y, size: 22, font: boldFont, color: NAVY })
    y -= 26

    if (cvData.title) {
      page.drawText(cvData.title, { x: MARGIN, y, size: 13, font, color: ORANGE })
      y -= 22
    }

    const contactLine = [cvData.email, cvData.phone, cvData.location].filter(Boolean).join('   ·   ')
    if (contactLine) {
      page.drawText(contactLine, { x: MARGIN, y, size: 10, font, color: GREY })
      y -= 24
    }

    // Body — parsed from the recruiter's freely-edited text
    const sections = parseSections(cvData.body || '')

    for (const section of sections) {
      sectionHeading(section.heading)

      const paragraphs = splitParagraphs(section.text)
      for (const paragraph of paragraphs) {
        const lines = paragraph.split('\n')
        // The first line of each paragraph (e.g. "Job Title —
        // Company (dates)") is rendered bold, giving the same
        // visual structure as before, but driven entirely by how
        // the recruiter formatted their own text rather than
        // separate form fields.
        lines.forEach((line, i) => {
          drawLine(line, 10.5, i === 0 ? boldFont : font, NAVY, 4)
        })
        y -= 10
      }
    }

    // Footer on every page
    const pages = pdfDoc.getPages()
    for (const p of pages) {
      p.drawText('Provided by Reach Network Recruitment  ·  reachnetworkrec.com', {
        x: MARGIN,
        y: 30,
        size: 8,
        font,
        color: LIGHT_GREY,
      })
    }

    const pdfBytes = await pdfDoc.save()

    const fileName = `${(cvData.name || 'candidate').replace(/[^a-z0-9]/gi, '-')}-CV.pdf`
    const path = `formatted/${candidateId}-${Date.now()}.pdf`
    await supabase.storage.from('candidate-cvs').upload(path, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
      upsert: true,
    })

    const { data: signedUrlData } = await supabase.storage
      .from('candidate-cvs')
      .createSignedUrl(path, 60 * 60 * 24 * 7) // valid 7 days

    if (sendToEmail) {
      await resend.emails.send({
        from: 'Reach Network Recruitment <hello@reachnetworkrec.com>',
        to: sendToEmail,
        subject: `CV: ${cvData.name || 'Candidate'}${cvData.title ? ` — ${cvData.title}` : ''}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
            <p style="color:#334155;font-size:15px;line-height:1.6;">
              Please find attached the CV for <b>${cvData.name || 'this candidate'}</b>.
            </p>
          </div>
        `,
        attachments: [{ filename: fileName, content: Buffer.from(pdfBytes).toString('base64') }],
      })
    }

    return NextResponse.json({ success: true, downloadUrl: signedUrlData?.signedUrl, sentTo: sendToEmail || null })
  } catch (err: any) {
    console.error('Generate formatted CV error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}