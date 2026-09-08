'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FieldType = 'signature' | 'initials' | 'date' | 'text'

type Signer = {
  id: string
  name: string
  email: string
  role_label: string
}

type PlacedField = {
  id: string
  signerId: string
  fieldType: FieldType
  label: string
  pageNumber: number
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

type Doc = { id: string; name: string; original_pdf_url: string; created_at: string }

type Envelope = {
  id: string
  document_id: string
  name: string
  status: string
  final_pdf_url: string | null
  created_at: string
  sent_at: string | null
  completed_at: string | null
}

type EnvelopeSignerRow = {
  id: string
  envelope_id: string
  name: string
  email: string
  role_label: string | null
  status: string
  signed_at: string | null
}

const FIELD_DEFAULT_SIZE: Record<FieldType, { w: number; h: number }> = {
  signature: { w: 22, h: 5 },
  initials: { w: 8, h: 5 },
  date: { w: 14, h: 4 },
  text: { w: 20, h: 4 },
}

const FIELD_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  text: 'Text',
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [envelopeSigners, setEnvelopeSigners] = useState<Record<string, EnvelopeSignerRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [showBuilder, setShowBuilder] = useState(false)
  const [builderDoc, setBuilderDoc] = useState<Doc | null>(null)
  const [envelopeName, setEnvelopeName] = useState('')
  const [signers, setSigners] = useState<Signer[]>([])
  const [activeSignerId, setActiveSignerId] = useState<string | null>(null)
  const [fields, setFields] = useState<PlacedField[]>([])
  const [placingFieldType, setPlacingFieldType] = useState<FieldType | null>(null)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pageDims, setPageDims] = useState<{ w: number; h: number }[]>([])
  const [renderingPdf, setRenderingPdf] = useState(false)
  const [savingEnvelope, setSavingEnvelope] = useState(false)
  const [sendingEnvelopeId, setSendingEnvelopeId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    const [docsResult, envelopesResult] = await Promise.all([
      supabase.from('esign_documents').select('*').order('created_at', { ascending: false }),
      supabase.from('esign_envelopes').select('*').order('created_at', { ascending: false }),
    ])

    setDocuments(docsResult.data || [])
    setEnvelopes(envelopesResult.data || [])

    if (envelopesResult.data && envelopesResult.data.length > 0) {
      const { data: signersData } = await supabase
        .from('esign_signers')
        .select('*')
        .in('envelope_id', envelopesResult.data.map((e) => e.id))

      const grouped: Record<string, EnvelopeSignerRow[]> = {}
      for (const s of signersData || []) {
        if (!grouped[s.envelope_id]) grouped[s.envelope_id] = []
        grouped[s.envelope_id].push(s)
      }
      setEnvelopeSigners(grouped)
    }

    setLoading(false)
  }

  async function handleUploadDocument(file: File) {
    setUploadingDoc(true)
    try {
      const supabase = createClient()
      const path = `originals/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('esign-documents').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('esign-documents').getPublicUrl(path)

      const { data: docRow, error: insertError } = await supabase
        .from('esign_documents')
        .insert({ name: file.name.replace(/\.pdf$/i, ''), original_pdf_url: data.publicUrl })
        .select()
        .single()

      if (insertError) throw insertError
      setDocuments([docRow, ...documents])
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'unknown error'))
    } finally {
      setUploadingDoc(false)
    }
  }

  async function openBuilder(doc: Doc) {
    const firstSignerId = crypto.randomUUID()
    setBuilderDoc(doc)
    setEnvelopeName(doc.name)
    setSigners([{ id: firstSignerId, name: '', email: '', role_label: 'Client' }])
    setActiveSignerId(firstSignerId)
    setFields([])
    setPlacingFieldType(null)
    setShowBuilder(true)
    await renderPdfPages(doc.original_pdf_url)
  }

  async function renderPdfPages(pdfUrl: string) {
    setRenderingPdf(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      if (!pdfUrl) {
        throw new Error('This document has no file URL — try re-uploading it.')
      }
      const loadingTask = pdfjsLib.getDocument({ url: pdfUrl })
      const pdf = await loadingTask.promise

      const images: string[] = []
      const dims: { w: number; h: number }[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, canvas, viewport }).promise
        images.push(canvas.toDataURL('image/png'))
        dims.push({ w: viewport.width, h: viewport.height })
      }

      setPageImages(images)
      setPageDims(dims)
    } catch (err: any) {
      alert('Could not render PDF: ' + (err?.message || 'unknown error'))
    } finally {
      setRenderingPdf(false)
    }
  }

  function addSigner() {
    const newId = crypto.randomUUID()
    setSigners([...signers, { id: newId, name: '', email: '', role_label: '' }])
    setActiveSignerId(newId)
  }

  function updateSigner(id: string, patch: Partial<Signer>) {
    setSigners(signers.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function removeSigner(id: string) {
    setSigners(signers.filter((s) => s.id !== id))
    setFields(fields.filter((f) => f.signerId !== id))
    if (activeSignerId === id) setActiveSignerId(null)
  }

  function handlePageClick(pageNumber: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!placingFieldType || !activeSignerId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    const size = FIELD_DEFAULT_SIZE[placingFieldType]

    const newField: PlacedField = {
      id: crypto.randomUUID(),
      signerId: activeSignerId,
      fieldType: placingFieldType,
      label: FIELD_LABELS[placingFieldType],
      pageNumber,
      xPct: Math.max(0, Math.min(100 - size.w, xPct)),
      yPct: Math.max(0, Math.min(100 - size.h, yPct)),
      widthPct: size.w,
      heightPct: size.h,
    }

    setFields([...fields, newField])
    setPlacingFieldType(null)
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id))
  }

  function signerColor(signerId: string) {
    const idx = signers.findIndex((s) => s.id === signerId)
    const colors = ['#F7931E', '#0ea5e9', '#7c3aed', '#16a34a']
    return colors[idx % colors.length]
  }

  async function handleSaveAndSend() {
    if (!builderDoc) return
    if (!envelopeName.trim()) return alert('Please name this envelope.')
    if (signers.some((s) => !s.name.trim() || !s.email.trim())) {
      return alert('Please fill in a name and email for every signer.')
    }
    if (fields.length === 0) {
      return alert('Place at least one field (e.g. a signature box) before sending.')
    }

    setSavingEnvelope(true)
    const supabase = createClient()

    try {
      const { data: envelope, error: envelopeError } = await supabase
        .from('esign_envelopes')
        .insert({ document_id: builderDoc.id, name: envelopeName, status: 'draft' })
        .select()
        .single()
      if (envelopeError) throw envelopeError

      const signerIdMap: Record<string, string> = {}
      for (const signer of signers) {
        const { data: signerRow, error: signerError } = await supabase
          .from('esign_signers')
          .insert({
            envelope_id: envelope.id,
            name: signer.name,
            email: signer.email,
            role_label: signer.role_label || null,
            signing_token: crypto.randomUUID(),
          })
          .select()
          .single()
        if (signerError) throw signerError
        signerIdMap[signer.id] = signerRow.id
      }

      const fieldRows = fields.map((f) => ({
        envelope_id: envelope.id,
        signer_id: signerIdMap[f.signerId],
        field_type: f.fieldType,
        label: f.label,
        page_number: f.pageNumber,
        x_pct: f.xPct,
        y_pct: f.yPct,
        width_pct: f.widthPct,
        height_pct: f.heightPct,
      }))

      const { error: fieldsError } = await supabase.from('esign_fields').insert(fieldRows)
      if (fieldsError) throw fieldsError

      const sendRes = await fetch('/api/envelopes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelopeId: envelope.id }),
      })
      const sendResult = await sendRes.json()
      if (!sendRes.ok) throw new Error(sendResult.error || 'Send failed')

      setShowBuilder(false)
      await loadData()
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSavingEnvelope(false)
    }
  }

  async function handleResendEnvelope(envelope: Envelope) {
    setSendingEnvelopeId(envelope.id)
    try {
      const res = await fetch('/api/envelopes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelopeId: envelope.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Resend failed')
      alert('Reminder emails sent to anyone who has not signed yet.')
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSendingEnvelopeId(null)
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-500',
      sent: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      voided: 'bg-red-100 text-red-600',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>{status}</span>
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Documents to send for signature</h3>
        <label className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition cursor-pointer">
          {uploadingDoc ? 'Uploading…' : '+ Upload PDF'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUploadDocument(file)
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
            <p className="text-xs text-slate-400 mt-1">
              Uploaded {new Date(doc.created_at).toLocaleDateString('en-GB')}
            </p>
            <button
              onClick={() => openBuilder(doc)}
              className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2 rounded-lg"
            >
              Send for Signature
            </button>
          </div>
        ))}
        {documents.length === 0 && <p className="text-slate-500 col-span-full">No documents uploaded yet.</p>}
      </div>

      <h3 className="font-bold text-slate-800 mb-3">Sent envelopes</h3>
      <div className="space-y-3">
        {envelopes.map((envelope) => {
          const rows = envelopeSigners[envelope.id] || []
          return (
            <div key={envelope.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900">{envelope.name}</h4>
                    {statusBadge(envelope.status)}
                  </div>
                  <div className="mt-2 space-y-1">
                    {rows.map((s) => (
                      <p key={s.id} className="text-xs text-slate-500">
                        {s.name} ({s.role_label || 'Signer'}) —{' '}
                        <span
                          className={
                            s.status === 'signed'
                              ? 'text-green-600 font-semibold'
                              : s.status === 'viewed'
                              ? 'text-orange-600 font-semibold'
                              : 'text-slate-400'
                          }
                        >
                          {s.status}
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {envelope.status === 'sent' && (
                    <button
                      onClick={() => handleResendEnvelope(envelope)}
                      disabled={sendingEnvelopeId === envelope.id}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      {sendingEnvelopeId === envelope.id ? 'Sending…' : 'Send Reminder'}
                    </button>
                  )}
                  {envelope.status === 'completed' && envelope.final_pdf_url && (
                    <a
                      href={envelope.final_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Download Signed PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {envelopes.length === 0 && <p className="text-slate-500">No envelopes sent yet.</p>}
      </div>

      {showBuilder && builderDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Send "{builderDoc.name}" for Signature</h2>
              <button onClick={() => setShowBuilder(false)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>

            <input
              placeholder="Envelope name (internal)"
              value={envelopeName}
              onChange={(e) => setEnvelopeName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <div className="grid lg:grid-cols-[280px_1fr] gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Signers</p>
                  <div className="space-y-2">
                    {signers.map((signer) => (
                      <div
                        key={signer.id}
                        className={`rounded-lg border-2 p-2.5 cursor-pointer ${
                          activeSignerId === signer.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200'
                        }`}
                        onClick={() => setActiveSignerId(signer.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="h-2.5 w-2.5 rounded-full inline-block"
                            style={{ backgroundColor: signerColor(signer.id) }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeSigner(signer.id)
                            }}
                            className="text-[11px] text-red-500 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          placeholder="Name"
                          value={signer.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-1"
                        />
                        <input
                          placeholder="Email"
                          value={signer.email}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-1"
                        />
                        <input
                          placeholder="Role (e.g. Client)"
                          value={signer.role_label}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateSigner(signer.id, { role_label: e.target.value })}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addSigner}
                    className="mt-2 w-full text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg py-2"
                  >
                    + Add another signer
                  </button>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    {activeSignerId ? 'Add a field, then click the PDF' : 'Select a signer first'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['signature', 'initials', 'date', 'text'] as FieldType[]).map((type) => (
                      <button
                        key={type}
                        disabled={!activeSignerId}
                        onClick={() => setPlacingFieldType(type)}
                        className={`text-xs font-semibold px-2 py-2 rounded-lg border-2 disabled:opacity-30 ${
                          placingFieldType === type ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'
                        }`}
                      >
                        + {FIELD_LABELS[type]}
                      </button>
                    ))}
                  </div>
                  {placingFieldType && (
                    <p className="text-[11px] text-orange-600 font-semibold mt-2">
                      Click anywhere on the document to place it.
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-[70vh] bg-slate-100 p-4">
                {renderingPdf && <p className="text-center text-slate-500 py-10">Rendering document…</p>}
                {pageImages.map((src, i) => (
                  <div
                    key={i}
                    className="relative mx-auto mb-4 bg-white shadow-sm"
                    style={{ width: '100%', maxWidth: 700, cursor: placingFieldType ? 'crosshair' : 'default' }}
                    onClick={(e) => handlePageClick(i + 1, e)}
                  >
                    <img src={src} alt={`Page ${i + 1}`} className="w-full block pointer-events-none" />
                    {fields
                      .filter((f) => f.pageNumber === i + 1)
                      .map((f) => (
                        <div
                          key={f.id}
                          className="absolute flex items-center justify-center text-[10px] font-bold text-white rounded"
                          style={{
                            left: `${f.xPct}%`,
                            top: `${f.yPct}%`,
                            width: `${f.widthPct}%`,
                            height: `${f.heightPct}%`,
                            backgroundColor: signerColor(f.signerId) + 'cc',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeField(f.id)
                          }}
                          title="Click to remove"
                        >
                          {f.label}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                onClick={handleSaveAndSend}
                disabled={savingEnvelope}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                {savingEnvelope ? 'Sending…' : 'Save & Send for Signature'}
              </button>
              <button
                onClick={() => setShowBuilder(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}