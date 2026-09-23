import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { cvText } = await request.json()

    if (!cvText || cvText.trim().length < 20) {
      return NextResponse.json({ error: 'Could not read any text from that CV' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Extract this CV into structured header fields plus one continuous body of text. Respond with ONLY a JSON object, no other text, no markdown fences, in exactly this shape:

{
  "name": "",
  "title": "",
  "email": "",
  "phone": "",
  "location": "",
  "body": ""
}

For "body": write out the full CV content (profile summary, work experience, education, skills — everything except the header fields above) as ONE continuous block of plain text, formatted like this:

## Profile
A short 2-4 sentence summary.

## Experience
Job Title — Company Name (dates)
A short paragraph about this role.

Another Job Title — Another Company (dates)
Description of that role.

## Education
Qualification — Institution (dates)

## Skills
Comma, separated, list, of, skills

Use "## " to start each section heading exactly as shown. Keep job entries in reverse-chronological order (most recent first). Write it exactly as it should read in a real CV — this is not a JSON structure, just a formatted block of text.

Notes:
- "title" is a short professional headline (e.g. "Warehouse Operative" or "HGV Class 1 Driver") — infer it from their most recent role if not stated explicitly.
- Only include sections that have real content in the CV. Don't invent information that isn't there.

CV text:
${cvText.slice(0, 12000)}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      return NextResponse.json({ error: 'CV parsing service error' }, { status: 500 })
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || '{}'
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Could not parse the extraction result' }, { status: 500 })
    }

    return NextResponse.json({
      name: parsed.name || '',
      title: parsed.title || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
      body: parsed.body || '',
    })
  } catch (err: any) {
    console.error('Parse full CV error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}