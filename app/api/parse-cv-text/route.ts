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
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Extract the candidate's contact details from this CV text. Respond with ONLY a JSON object, no other text, no markdown code fences, in exactly this shape:
{"first_name": "", "last_name": "", "email": "", "phone": "", "address": ""}

If a field genuinely isn't present in the text, use an empty string for it. Do not guess or invent information that isn't there.

CV text:
${cvText.slice(0, 8000)}`,
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

    // Strip markdown code fences if the model added them despite
    // being asked not to
    const cleaned = rawText.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: 'Could not parse the extraction result' }, { status: 500 })
    }

    return NextResponse.json({
      first_name: parsed.first_name || '',
      last_name: parsed.last_name || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      address: parsed.address || '',
    })
  } catch (err: any) {
    console.error('Parse CV error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}