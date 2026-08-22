import { createClient } from '@/lib/supabase/server'
import LookingForWorkClient from './LookingForWorkClient'

export const dynamic = 'force-dynamic'

export default async function LookingForWorkPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return <LookingForWorkClient jobs={jobs || []} />
}