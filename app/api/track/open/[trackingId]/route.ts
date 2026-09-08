import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// A 1x1 transparent GIF, hardcoded as bytes — this is what actually
// gets served back to the email client when it loads the tracking
// pixel, regardless of whether the database update below succeeds.
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7',
  'base64'
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params
  const cleanId = trackingId.replace(/\.(png|gif)$/i, '')

  try {
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('email_sends')
      .select('id, opened_at, open_count')
      .eq('tracking_id', cleanId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('email_sends')
        .update({
          opened_at: existing.opened_at || new Date().toISOString(),
          open_count: (existing.open_count || 0) + 1,
        })
        .eq('id', existing.id)
    }
  } catch (err) {
    console.error('Open tracking error:', err)
    // Deliberately swallow the error — the pixel must always return
    // successfully so the email renders normally either way.
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  })
}