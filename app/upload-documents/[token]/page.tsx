import { createClient as createServiceClient } from '@supabase/supabase-js'
import UploadClient from './UploadClient'

function getServiceClient() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getRequestData(token: string) {
  const supabase = getServiceClient()

  const { data: docRequest } = await supabase
    .from('document_requests')
    .select('*')
    .eq('request_token', token)
    .maybeSingle()

  if (!docRequest) return null

  const { data: uploads } = await supabase
    .from('document_uploads')
    .select('*')
    .eq('request_id', docRequest.id)
    .order('uploaded_at', { ascending: false })

  return { docRequest, uploads: uploads || [] }
}

export default async function UploadDocumentsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getRequestData(token)

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Link not found</h1>
          <p className="mt-2 text-slate-500">This upload link may have expired or is incorrect.</p>
        </div>
      </main>
    )
  }

  return <UploadClient token={token} docRequest={data.docRequest} initialUploads={data.uploads} />
}