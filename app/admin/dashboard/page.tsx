import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: applications } = await supabase
    .from('job_applications')
    .select('*, jobs(title)')
    .order('created_at', { ascending: false })

  return <DashboardClient initialJobs={jobs || []} initialApplications={applications || []} />
}
