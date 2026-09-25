'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type DocRequest = {
  id: string
  candidate_name: string
  candidate_email: string
  message: string | null
  request_token: string
  status: string
  created_at: string
  completed_at: string | null
}

type Upload = {
  id: string
  request_id: string
  document_type: string
  file_path: string
  file_name: string | null
  uploaded_at: string
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  right_to_work: 'Right to Work / Passport',
  driving_licence_front: 'Driving Licence — Front',
  driving_licence_back: 'Driving Licence — Back',
  cpc_front: 'CPC Card — Front',
  cpc_back: 'CPC Card — Back',
  tacho_front: 'Tacho Card — Front',
  tacho_back: 'Tacho Card — Back',
  selfie: 'Selfie',
}

export default function DocumentRequestsTab() {
  const [requests, setRequests] = useState<DocRequest[]>([])
  constequest, setUploadsByRequest] = useState<Record<string, Upload[]>>({})
  const [loading, setLoading] = useState(true)

  const [showSendForm, setShowSendForm] = useState(false)
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', message: '' })
  const [sending, setSending] = useState(false)

  const [viewingRequest, setViewingRequest] = useState<DocRequest | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: requestsData } = await supabase
      .from('document_requests')
      .select('*')
      .order('created_at', { ascending: false })

    setRequests(requestsData || [])

    if (requestsData && requestsData.length > 0) {
      const { data: uploadsData } = await supabase
        .from('document_uploads')
        .select('*')
        .in('request_id', requestsData.map((r) => r.id))

      const grouped: Record<string, Upload[]> = {}
      for (const u of uploadsData || []) {
        if (!grouped[u.request_id]) grouped[u.request_id] = []
        grouped[u.request_id].push(u)
      }
      setUploadsByRequest(grouped)
    }

    setLoading(false)
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/document-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to send')

      setForm({ candidateName: '', candidateEmail: '', message: '' })
      setShowSendForm(false)
      await loadData()
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSending(false)
    }
  }

  async function handleViewFile(upload: Upload) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('candidate-documents')
      .createSignedUrl(upload.file_path, 300)
    if (error || !data) {
      alert('Could not open file: ' + (error?.message || 'unknown error'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDeleteRequest(id: string) {
    if (!confirm('Delete this document request and everything uploaded to it?')) return
    const supabase = createClient()
    const { error } = await supabase.from('document_requests').delete().eq('id', id)
    if (!error) setRequests(requests.filter((r) => r.id !== id))
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-slate-100 text-slate-500',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
    }
    const labels: Record<string, string> = {
      pending: 'Not started',
      in_progress: 'In progress',
      completed: 'Completed',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Document Requests</h3>
        <button
          onClick={() => setShowSendForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Request Documents
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Send a candidate a secure link to upload their right-to-work, licence, CPC, tacho card and selfie — no more
        chasing documents by email.
      </p>

      <div className="space-y-3">
        {requests.map((req) => {
          const uploads = uploadsByRequest[req.id] || []
          return (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-4 curpointer hover:border-orange-300"
              onClick={() => setViewingRequest(req)}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{req.candidate_name}</p>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-sm text-slate-500">{req.candidate_email}</p>
                  <p className="text-xs text-slate-400 mt-1">{uploads.length} document(s) uploaded</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteRequest(req.id)
                  }}
                  className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
        {requests.length === 0 && <p className="text-slate-500 text-sm">No document requests sent yet.</p>}
      </div>

      {showSendForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Request Documents</h2>
            <form onSubmit={handleSendRequest} className="space-y-3">
              <input
                placeholder="Candidate name"
                required
                value={form.candidateName}
                onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                type="email"
                placeholder="Candidate email"
                required
                value={form.candidateEmail}
                onChange={(e) => setForm({ ...form, candidateEmail: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Personal message (optional) — otherwise we'll use a friendly default"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semi py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">{viewingRequest.candidate_name}</h2>
              <button onClick={() => setViewingRequest(null)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">{viewingRequest.candidate_email}</p>

            <div className="space-y-2">
              {(uploadsByRequest[viewingRequest.id] || []).map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {DOCUMENT_TYPE_LABELS[upload.document_type] || upload.document_type}
                    </p>
                    <p className="text-xs text-slate-400">{upload.file_name}</p>
                  </div>
                  <button
                    onClick={() => handleViewFile(upload)}
                    className="text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5"
                  >
                    View
                  </button>
                </div>
              ))}
              {(uploadsByRequest[viewingRequest.id] || []).length === 0 && (
                <p className="text-sm text-slate-400">Nothing uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
