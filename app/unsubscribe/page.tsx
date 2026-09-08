import { createClient } from '@/lib/supabase/server'

async function unsubscribeContact(trackingId: string) {
  const supabase = await createClient()

  const { data: send } = await supabase
    .from('email_sends')
    .select('contact_id')
    .eq('tracking_id', trackingId)
    .maybeSingle()

  if (!send?.contact_id) return false

  const { error } = await supabase
    .from('email_contacts')
    .update({ unsubscribed: true })
    .eq('id', send.contact_id)

  return !error
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const { t } = await searchParams
  const success = t ? await unsubscribeContact(t) : false

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {success ? "You're unsubscribed" : 'Something went wrong'}
        </h1>
        <p className="mt-3 text-slate-500">
          {success
            ? "You won't receive any further marketing emails from Reach Network Recruitment."
            : "We couldn't find that request. If you keep receiving emails, reply and let us know."}
        </p>
      </div>
    </main>
  )
}