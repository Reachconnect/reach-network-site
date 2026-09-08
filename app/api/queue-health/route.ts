import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// A plain, unauthenticated status check — safe to expose publicly
// since it reveals nothing except "is the background job alive".
// Point an external monitor (UptimeRobot, cron-job.org's own
// monitoring, etc.) at this URL if you want a second, independent
// way to notice the queue has stopped running.
export async function GET() {
  const supabase = getServiceClient()

  const { data } = await supabase.from('queue_heartbeat').select('last_run_at').eq('id', 1).maybeSingle()

  if (!data?.last_run_at) {
    return NextResponse.json({ healthy: false, reason: 'No heartbeat recorded yet' }, { status: 503 })
  }

  const minutesSinceLastRun = (Date.now() - new Date(data.last_run_at).getTime()) / 60000
  const healthy = minutesSinceLastRun < 15

  return NextResponse.json(
    {
      healthy,
      lastRunAt: data.last_run_at,
      minutesSinceLastRun: Math.round(minutesSinceLastRun),
    },
    { status: healthy ? 200 : 503 }
  )
}