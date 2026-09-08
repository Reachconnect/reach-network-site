import { createClient as createServiceClient } from '@supabase/supabase-js'
import SigningClient from './SigningClient'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSigningData(token: string) {
  const supabase = getServiceClient()

  const { data: signer } = await supabase
    .from('esign_signers')
    .select('*')
    .eq('signing_token', token)
    .maybeSingle()

  if (!signer) return null

  const { data: envelope } = await supabase
    .from('esign_envelopes')
    .select('*, esign_documents(*)')
    .eq('id', signer.envelope_id)
    .single()

  const { data: fields } = await supabase
    .from('esign_fields')
    .select('*')
    .eq('envelope_id', signer.envelope_id)

  // Mark this signer as "viewed" the first time they open the link
  if (signer.status === 'pending') {
    await supabase.from('esign_signers').update({ status: 'viewed' }).eq('id', signer.id)
  }

  return { signer, envelope, fields: fields || [] }
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getSigningData(token)

  if (!data || !data.envelope) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Link not found</h1>
          <p className="mt-2 text-slate-500">This signing link may have expired or is incorrect.</p>
        </div>
      </main>
    )
  }

  if (data.envelope.status === 'voided') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">This document has been withdrawn</h1>
          <p className="mt-2 text-slate-500">Please contact Reach Network Recruitment if you have questions.</p>
        </div>
      </main>
    )
  }

  return (
    <SigningClient
      token={token}
      signer={data.signer}
      envelope={data.envelope}
      document={data.envelope.esign_documents}
      fields={data.fields}
    />
  )
}