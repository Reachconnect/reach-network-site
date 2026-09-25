'use client'

import { useState } from 'react'

type DocRequest = {
  id: string
  candidate_name: string
  candidate_email: string
  status: string
}

type Upload = {
  id: string
  document_type: string
  file_name: string | null
}

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'right_to_work', label: 'Right to Work / Passport' },
  { value: 'driving_licence_front', label: 'Driving Licence — Front' },
  { value: 'driving_licence_back', label: 'Driving Licence — Back' },
  { value: 'cpc_front', label: 'CPC Card — Front' },
  { value: 'cpc_back', label: 'CPC Card — Back' },
  { value: 'tacho_front', label: 'Tacho Card — Front' },
  { value: 'tacho_back', label: 'Tacho Card — Back' },
  { value: 'selfie', label: 'Selfie' },
]

export default function UploadClient({
  token,
  docRequest,
  initialUploads,
}: {
  token: string
  docRequest: DocRequest
  initialUploads: Upload[]
}) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads)
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0].value)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(docRequest.status === 'completed')
  const [finishing, setFinishing] = useState(false)

  const uploadedTypes = new Set(uploads.map((u) => u.document_type))

  async function handleUpload() {
    if (!selectedFile) {
      setError('Please choose a file first.')
      return
    }
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('documentType', selectedType)
      formData.append('file', selectedFile)

      const res = await fetch('/api/document-requests/upload', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Upload failed')

      setUploads([
        { id: crypto.randomUUID(), document_type: selectedType, file_name: selectedFile.name },
        ...uploads,
      ])
      setSelectedFile(null)

      // Jump the dropdown to the next thing they haven't uploaded yet,
      // so they can just keep going without thinking about it
      const next = DOCUMENT_TYPES.find((t) => t.value !== selectedType && !uploadedTypes.has(t.value))
      if (next) setSelectedType(next.value)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      const res = await fetch('/api/document-requests/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) throw new Error('Could not finish — please try again.')
      setFinished(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setFinishing(false)
    }
  }

  if (finished) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">All done!</h1>
          <p className="mt-2 text-slate-500">
            Thanks {docRequest.candidate_name.split(' ')[0]}, we've got your documents. We'll be in touch shortly.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-[#0F2438] px-6 py-6">
        <p className="text-white font-bold text-lg">
          REACH<span className="text-[#F7931E]">NETWORK</span>
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Hi {docRequest.candidate_name.split(' ')[0]},</h1>
        <p className="mt-2 text-slate-600 leading-relaxed">
          We just need a few documents from you. It's quick — take a photo or choose one from your phone, upload
          it below, and repeat for each item on the list. You don't have to do them all at once.
        </p>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">What we need</p>
          <div className="space-y-2">
            {DOCUMENT_TYPES.map((type) => {
              const done = uploadedTypes.has(type.value)
              return (
                <div
                  key={type.value}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                    done ? 'bg-green-50' : 'bg-slate-50'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span className={`text-sm ${done ? 'text-green-700 font-semibold' : 'text-slate-700'}`}>
                    {type.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border-2 border-[#F7931E] p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Upload a document</p>

          <label className="text-sm font-semibold text-slate-700">1. What are you uploading?</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-3 text-base mt-1 mb-4 bg-white"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {uploadedTypes.has(type.value) ? '✓ ' : ''}
                {type.label}
              </option>
            ))}
          </select>

          <label className="text-sm font-semibold text-slate-700">2. Choose a photo or file</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full border border-slate-300 rounded-lg px-3 py-3 text-sm mt-1 mb-4 bg-white"
          />

          {error && <p className="text-sm font-semibold text-red-600 mb-3">{error}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="w-full bg-[#F7931E] hover:opacity-90 text-white font-bold py-3.5 rounded-lg text-base disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '3. Upload This Document'}
          </button>
        </div>

        <button
          onClick={handleFinish}
          disabled={finishing || uploads.length === 0}
          className="w-full mt-6 bg-[#0F2438] hover:opacity-90 text-white font-bold py-3.5 rounded-lg text-base disabled:opacity-40"
        >
          {finishing ? 'Finishing…' : "I'm Done — Submit My Documents"}
        </button>
        {uploads.length === 0 && (
          <p className="text-center text-xs text-slate-400 mt-2">Upload at least one document first.</p>
        )}
      </div>
    </main>
  )
}