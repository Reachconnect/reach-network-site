import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const trackingId = request.nextUrl.searchParams.get('t')
  const destination = request.nextUrl.searchParams.get('u')

  if (!destination) {
    return NextResponse.redirect('https://www.reachnetworkrec.com')
  }

  const decodedDestination = decodeURIComponent(destination)

  try {
    if (trackingId) {
      const supabase = await createClient()

      const { data: existing } = await supabase
        .from('email_sends')
        .select('id, clicked_at, click_count')
        .eq('tracking_id', trackingId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('email_sends')
          .update({
            clicked_at: existing.clicked_at || new Date().toISOString(),
            click_count: (existing.click_count || 0) + 1,
          })
          .eq('id', existing.id)

        await supabase.from('email_click_events').insert({
          send_id: existing.id,
          url: decodedDestination,
        })
      }
    }
  } catch (err) {
    console.error('Click tracking error:', err)
    // Deliberately swallow the error — the person should still reach
    // their destination even if logging the click fails.
  }

  return NextResponse.redirect(decodedDestination)
}