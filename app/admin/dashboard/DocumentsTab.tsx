'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FieldType = 'signature' | 'initials' | 'date' | 'text' | 'admin_text'

const ADMIN_SIGNER_ID = 'admin'

type Signer = {
  id: string
  name: string
  email: string
  role_label: string
}

type PlacedField = {
  id: string
  signerId: string
  documentId: string
  fieldType: FieldType
  label: string
  pageNumber: number
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
  presetValue?: string
}

type Doc = { id: string; name: string; original_pdf_url: string; created_at: string }

type DocGroup = { documentId: string; documentName: string; pages: string[] }

type Envelope = {
  id: string
  name: string
  status: string
  final_pdf_url: string | null
  created_at: string
  sent_at: string | null
  completed_at: string | null
  documentNames?: string[]
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
  signature: { w: 14, h: 3.5 },
  initials: { w: 6, h: 3.5 },
  date: { w: 10, h: 3 },
  text: { w: 14, h: 3 },
  admin_text: { w: 18, h: 3.5 },
}

const MIN_FIELD_SIZE = { w: 3, h: 1.5 } // percent of page dimensions

const FIELD_LABELS: Record<FieldType, string> = {
  signature: 'Signature',
  initials: 'Initials',
  date: 'Date',
  text: 'Text',
  admin_text: 'Your Text',
}

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<Doc[]>([])
  const [envelopes, setEnvelopes] = useState<Envelope[]>([])
  const [envelopeSigners, setEnvelopeSigners] = useState<Record<string, EnvelopeSignerRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())

  const [showBuilder, setShowBuilder] = useState(false)
  const [builderDocIds, setBuilderDocIds] = useState<string[]>([])
  const [envelopeName, setEnvelopeName] = useState('')
  const [signers, setSigners] = useState<Signer[]>([])
  const [activeSignerId, setActiveSignerId] = useState<string | null>(null)
  const [fields, setFields] = useState<PlacedField[]>([])
  const [placingFieldType, setPlacingFieldType] = useState<FieldType | null>(null)
  const [pendingTextPlacement, setPendingTextPlacement] = useState<{
    documentId: string
    pageNumber: number
    xPct: number
    yPct: number
    w: number
    h: number
  } | null>(null)
  const [pendingTextValue, setPendingTextValue] = useState('')
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null)
  const resizeDragRef = useRef<{
    fieldId: string
    startX: number
    startY: number
    startW: number
    startH: number
    pageWidthPx: number
    pageHeightPx: number
  } | null>(null)
  const [movingFieldId, setMovingFieldId] = useState<string | null>(null)
  const moveDragRef = useRef<{
    fieldId: string
    startX: number
    startY: number
    startXPct: number
    startYPct: number
    pageWidthPx: number
    pageHeightPx: number
    hasDragged: boolean
  } | null>(null)
  const [docGroups, setDocGroups] = useState<DocGroup[]>([])
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

    let envelopesWithDocs: Envelope[] = envelopesResult.data || []

    if (envelopesWithDocs.length > 0) {
      const { data: envelopeDocsData } = await supabase
        .from('envelope_documents')
        .select('envelope_id, order_index, esign_documents(name)')
        .in(
          'envelope_id',
          envelopesWithDocs.map((e) => e.id)
        )
        .order('order_index', { ascending: true })

      const namesByEnvelope: Record<string, string[]> = {}
      for (const row of (envelopeDocsData || []) as any[]) {
        if (!namesByEnvelope[row.envelope_id]) namesByEnvelope[row.envelope_id] = []
        namesByEnvelope[row.envelope_id].push(row.esign_documents?.name || 'Untitled')
      }

      envelopesWithDocs = envelopesWithDocs.map((e) => ({
        ...e,
        documentNames: namesByEnvelope[e.id] || [],
      }))

      const { data: signersData } = await supabase
        .from('esign_signers')
        .select('*')
        .in('envelope_id', envelopesWithDocs.map((e) => e.id))

      const grouped: Record<string, EnvelopeSignerRow[]> = {}
      for (const s of signersData || []) {
        if (!grouped[s.envelope_id]) grouped[s.envelope_id] = []
        grouped[s.envelope_id].push(s)
      }
      setEnvelopeSigners(grouped)
    }

    setEnvelopes(envelopesWithDocs)
    setLoading(false)
  }

  async function handleDeleteSelectedDocuments() {
    if (selectedDocIds.size === 0) return
    const supabase = createClient()
    const idsToDelete = Array.from(selectedDocIds)

    // Don't let a document be deleted out from under an envelope
    // that's still awaiting signature — check first.
    const { data: activeRefs } = await supabase
      .from('envelope_documents')
      .select('document_id, esign_envelopes(name, status)')
      .in('document_id', idsToDelete)

    const blocked = (activeRefs || []).filter((row: any) => ['draft', 'sent'].includes(row.esign_envelopes?.status))
    const blockedIds = new Set(blocked.map((row: any) => row.document_id))

    if (blockedIds.size > 0) {
      const blockedNames = documents.filter((d) => blockedIds.has(d.id)).map((d) => d.name)
      alert(
        `Can't delete: ${blockedNames.join(', ')} — still part of an envelope that hasn't finished signing yet. Withdraw or complete that envelope first.`
      )
    }

    const safeIds = idsToDelete.filter((id) => !blockedIds.has(id))
    if (safeIds.length === 0) return

    if (!confirm(`Delete ${safeIds.length} document(s)? This cannot be undone.`)) return

    const { error } = await supabase.from('esign_documents').delete().in('id', safeIds)
    if (!error) {
      setDocuments(documents.filter((d) => !safeIds.includes(d.id)))
      setSelectedDocIds(new Set())
    } else {
      alert(error.message)
    }
  }

  async function handleUploadDocuments(files: FileList) {
    setUploadingDoc(true)
    try {
      const supabase = createClient()
      const fileArray = Array.from(files)

      let finalBlob: Blob
      let finalName: string

      if (fileArray.length > 1) {
        // Multiple files selected at once are merged into a single
        // PDF, so they become one signing document rather than
        // several separate library entries.
        const { PDFDocument } = await import('pdf-lib')
        const mergedPdf = await PDFDocument.create()

        for (const file of fileArray) {
          const bytes = await file.arrayBuffer()
          const srcDoc = await PDFDocument.load(bytes)
          const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices())
          copiedPages.forEach((page) => mergedPdf.addPage(page))
        }

        const mergedBytes = await mergedPdf.save()
        finalBlob = new Blob([mergedBytes], { type: 'application/pdf' })
        finalName = fileArray.map((f) => f.name.replace(/\.pdf$/i, '')).join(' + ')
      } else {
        finalBlob = fileArray[0]
        finalName = fileArray[0].name.replace(/\.pdf$/i, '')
      }

      const safeFileName = finalName.replace(/[^a-z0-9]/gi, '-')
      const path = `originals/${Date.now()}-${safeFileName}.pdf`
      const { error } = await supabase.storage.from('esign-documents').upload(path, finalBlob)
      if (error) throw error
      const { data } = supabase.storage.from('esign-documents').getPublicUrl(path)

      const { data: docRow, error: insertError } = await supabase
        .from('esign_documents')
        .insert({ name: finalName, original_pdf_url: data.publicUrl })
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

  function toggleDocSelection(id: string) {
    setSelectedDocIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function openBuilder(docIds: string[]) {
    const firstSignerId = crypto.randomUUID()
    setBuilderDocIds(docIds)
    const includedNames = documents.filter((d) => docIds.includes(d.id)).map((d) => d.name)
    setEnvelopeName(includedNames.join(' + '))
    setSigners([{ id: firstSignerId, name: '', email: '', role_label: 'Client' }])
    setActiveSignerId(firstSignerId)
    setFields([])
    setPlacingFieldType(null)
    setShowBuilder(true)
    await renderAllDocuments(docIds)
  }

  async function renderAllDocuments(docIds: string[]) {
    setRenderingPdf(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const groups: DocGroup[] = []

      for (const docId of docIds) {
        const doc = documents.find((d) => d.id === docId)
        if (!doc) continue

        const loadingTask = pdfjsLib.getDocument({ url: doc.original_pdf_url })
        const pdf = await loadingTask.promise

        const images: string[] = []
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, canvas, viewport }).promise
          images.push(canvas.toDataURL('image/png'))
        }

        groups.push({ documentId: docId, documentName: doc.name, pages: images })
      }

      setDocGroups(groups)
    } catch (err: any) {
      alert('Could not render one or more documents: ' + (err?.message || 'unknown error'))
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

  function handlePageClick(documentId: string, pageNumber: number, e: React.MouseEvent<HTMLDivElement>) {
    if (!placingFieldType) return
    if (placingFieldType !== 'admin_text' && !activeSignerId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width) * 100
    const yPct = ((e.clientY - rect.top) / rect.height) * 100
    const size = FIELD_DEFAULT_SIZE[placingFieldType]

    const clampedX = Math.max(0, Math.min(100 - size.w, xPct))
    const clampedY = Math.max(0, Math.min(100 - size.h, yPct))

    if (placingFieldType === 'admin_text') {
      setPendingTextPlacement({ documentId, pageNumber, xPct: clampedX, yPct: clampedY, w: size.w, h: size.h })
      setPendingTextValue('')
      setPlacingFieldType(null)
      return
    }

    const newField: PlacedField = {
      id: crypto.randomUUID(),
      signerId: activeSignerId!,
      documentId,
      fieldType: placingFieldType,
      label: FIELD_LABELS[placingFieldType],
      pageNumber,
      xPct: clampedX,
      yPct: clampedY,
      widthPct: size.w,
      heightPct: size.h,
    }

    setFields([...fields, newField])
    setPlacingFieldType(null)
  }

  function handleConfirmAdminText() {
    if (!pendingTextPlacement || !pendingTextValue.trim()) {
      setPendingTextPlacement(null)
      return
    }

    const newField: PlacedField = {
      id: crypto.randomUUID(),
      signerId: ADMIN_SIGNER_ID,
      documentId: pendingTextPlacement.documentId,
      fieldType: 'admin_text',
      label: 'Your Text',
      pageNumber: pendingTextPlacement.pageNumber,
      xPct: pendingTextPlacement.xPct,
      yPct: pendingTextPlacement.yPct,
      widthPct: pendingTextPlacement.w,
      heightPct: pendingTextPlacement.h,
      presetValue: pendingTextValue.trim(),
    }

    setFields([...fields, newField])
    setPendingTextPlacement(null)
    setPendingTextValue('')
  }

  function startResize(field: PlacedField, e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const pageEl = (e.target as HTMLElement).closest('[data-page-container]') as HTMLElement | null
    if (!pageEl) return
    const rect = pageEl.getBoundingClientRect()

    resizeDragRef.current = {
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      startW: field.widthPct,
      startH: field.heightPct,
      pageWidthPx: rect.width,
      pageHeightPx: rect.height,
    }
    setResizingFieldId(field.id)
  }

  useEffect(() => {
    if (!resizingFieldId) return

    function handleMouseMove(e: MouseEvent) {
      const drag = resizeDragRef.current
      if (!drag) return

      const deltaXPct = ((e.clientX - drag.startX) / drag.pageWidthPx) * 100
      const deltaYPct = ((e.clientY - drag.startY) / drag.pageHeightPx) * 100

      const newWidth = Math.max(MIN_FIELD_SIZE.w, drag.startW + deltaXPct)
      const newHeight = Math.max(MIN_FIELD_SIZE.h, drag.startH + deltaYPct)

      setFields((current) =>
        current.map((f) => (f.id === drag.fieldId ? { ...f, widthPct: newWidth, heightPct: newHeight } : f))
      )
    }

    function handleMouseUp() {
      resizeDragRef.current = null
      setResizingFieldId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingFieldId])

  function startMove(field: PlacedField, e: React.MouseEvent) {
    e.stopPropagation()
    const pageEl = (e.target as HTMLElement).closest('[data-page-container]') as HTMLElement | null
    if (!pageEl) return
    const rect = pageEl.getBoundingClientRect()

    moveDragRef.current = {
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      startXPct: field.xPct,
      startYPct: field.yPct,
      pageWidthPx: rect.width,
      pageHeightPx: rect.height,
      hasDragged: false,
    }
    setMovingFieldId(field.id)
  }

  useEffect(() => {
    if (!movingFieldId) return

    function handleMouseMove(e: MouseEvent) {
      const drag = moveDragRef.current
      if (!drag) return

      const deltaXPx = e.clientX - drag.startX
      const deltaYPx = e.clientY - drag.startY

      // Only treat this as an actual drag (not a click) once the
      // mouse has moved a small distance — otherwise a plain click
      // would always get swallowed as a zero-distance "drag".
      if (!drag.hasDragged && Math.hypot(deltaXPx, deltaYPx) > 4) {
        drag.hasDragged = true
      }
      if (!drag.hasDragged) return

      const deltaXPct = (deltaXPx / drag.pageWidthPx) * 100
      const deltaYPct = (deltaYPx / drag.pageHeightPx) * 100

      setFields((current) =>
        current.map((f) => {
          if (f.id !== drag.fieldId) return f
          const newX = Math.max(0, Math.min(100 - f.widthPct, drag.startXPct + deltaXPct))
          const newY = Math.max(0, Math.min(100 - f.heightPct, drag.startYPct + deltaYPct))
          return { ...f, xPct: newX, yPct: newY }
        })
      )
    }

    function handleMouseUp() {
      setMovingFieldId(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [movingFieldId])

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id))
  }

  function signerColor(signerId: string) {
    if (signerId === ADMIN_SIGNER_ID) return '#334155'
    const idx = signers.findIndex((s) => s.id === signerId)
    const colors = ['#F7931E', '#0ea5e9', '#7c3aed', '#16a34a']
    return colors[idx % colors.length]
  }

  async function handleSaveAndSend() {
    if (builderDocIds.length === 0) return
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
        .insert({ document_id: builderDocIds[0], name: envelopeName, status: 'draft' })
        .select()
        .single()
      if (envelopeError) throw envelopeError

      const envelopeDocRows = builderDocIds.map((docId, index) => ({
        envelope_id: envelope.id,
        document_id: docId,
        order_index: index,
      }))
      const { error: envelopeDocsError } = await supabase.from('envelope_documents').insert(envelopeDocRows)
      if (envelopeDocsError) throw envelopeDocsError

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
        signer_id: f.signerId === ADMIN_SIGNER_ID ? null : signerIdMap[f.signerId],
        document_id: f.documentId,
        field_type: f.fieldType,
        label: f.label,
        page_number: f.pageNumber,
        x_pct: f.xPct,
        y_pct: f.yPct,
        width_pct: f.widthPct,
        height_pct: f.heightPct,
        value: f.fieldType === 'admin_text' ? f.presetValue : null,
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
      setSelectedDocIds(new Set())
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

  async function handleDeleteEnvelope(envelope: Envelope) {
    const supabase = createClient()

    if (envelope.status === 'draft') {
      if (!confirm('Delete this draft envelope? It was never sent, so nothing external is affected.')) return
      const { error } = await supabase.from('esign_envelopes').delete().eq('id', envelope.id)
      if (!error) {
        setEnvelopes(envelopes.filter((e) => e.id !== envelope.id))
      } else {
        alert(error.message)
      }
      return
    }

    if (
      !confirm(
        'Withdraw this document? Anyone who still has the signing link will see it has been withdrawn, and it will no longer be signable.'
      )
    )
      return

    const { data, error } = await supabase
      .from('esign_envelopes')
      .update({ status: 'voided' })
      .eq('id', envelope.id)
      .select()
      .single()

    if (!error && data) {
      setEnvelopes(envelopes.map((e) => (e.id === envelope.id ? { ...data, documentNames: e.documentNames } : e)))
    } else if (error) {
      alert(error.message)
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
        <div className="flex gap-2">
          {selectedDocIds.size > 0 && (
            <button
              onClick={handleDeleteSelectedDocuments}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg transition"
            >
              Delete Selected ({selectedDocIds.size})
            </button>
          )}
          {selectedDocIds.size > 1 && (
            <button
              onClick={() => openBuilder(Array.from(selectedDocIds))}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Send Selected ({selectedDocIds.size}) for Signature
            </button>
          )}
          <label className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition cursor-pointer">
            {uploadingDoc ? 'Uploading…' : '+ Upload PDF(s)'}
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) handleUploadDocuments(files)
              }}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Selecting several files in "Upload PDF(s)" merges them into one document straight away. If you'd rather
        combine documents that are already uploaded separately, tick two or more below to bundle them into a single
        envelope instead.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`bg-white rounded-xl border-2 p-4 ${
              selectedDocIds.has(doc.id) ? 'border-orange-400' : 'border-slate-200'
            }`}
          >
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDocIds.has(doc.id)}
                onChange={() => toggleDocSelection(doc.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Uploaded {new Date(doc.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            </label>
            <button
              onClick={() => openBuilder([doc.id])}
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
                  {envelope.documentNames && envelope.documentNames.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {envelope.documentNames.length} document{envelope.documentNames.length === 1 ? '' : 's'}:{' '}
                      {envelope.documentNames.join(', ')}
                    </p>
                  )}
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
                  {(envelope.status === 'draft' || envelope.status === 'sent') && (
                    <button
                      onClick={() => handleDeleteEnvelope(envelope)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1"
                    >
                      {envelope.status === 'draft' ? 'Delete' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {envelopes.length === 0 && <p className="text-slate-500">No envelopes sent yet.</p>}
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                Send {builderDocIds.length > 1 ? `${builderDocIds.length} Documents` : 'Document'} for Signature
              </h2>
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
                    {activeSignerId ? 'Add a field, then click a page' : 'Select a signer first'}
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

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-4 mb-2">
                    Your own writing
                  </p>
                  <button
                    onClick={() => setPlacingFieldType('admin_text')}
                    className={`w-full text-xs font-semibold px-2 py-2 rounded-lg border-2 ${
                      placingFieldType === 'admin_text' ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    + Add Text (visible to everyone)
                  </button>

                  {placingFieldType && (
                    <p className="text-[11px] text-orange-600 font-semibold mt-2">
                      Click anywhere on any document below to place it.
                    </p>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-[70vh] bg-slate-100 p-4">
                {renderingPdf && <p className="text-center text-slate-500 py-10">Rendering documents…</p>}

                {docGroups.map((group, groupIndex) => (
                  <div key={group.documentId}>
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">
                        {groupIndex + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-700">{group.documentName}</p>
                    </div>

                    {group.pages.map((src, pageIndex) => (
                      <div
                        key={pageIndex}
                        data-page-container="true"
                        className="relative mx-auto mb-4 bg-white shadow-sm"
                        style={{ width: '100%', maxWidth: 700, cursor: placingFieldType ? 'crosshair' : 'default' }}
                        onClick={(e) => handlePageClick(group.documentId, pageIndex + 1, e)}
                      >
                        <img src={src} alt={`Page ${pageIndex + 1}`} className="w-full block pointer-events-none" />
                        {fields
                          .filter((f) => f.documentId === group.documentId && f.pageNumber === pageIndex + 1)
                          .map((f) => (
                            <div
                              key={f.id}
                              className="absolute flex items-center justify-center text-[10px] font-bold text-white rounded overflow-hidden cursor-move"
                              style={{
                                left: `${f.xPct}%`,
                                top: `${f.yPct}%`,
                                width: `${f.widthPct}%`,
                                height: `${f.heightPct}%`,
                                backgroundColor: signerColor(f.signerId) + 'cc',
                              }}
                              onMouseDown={(e) => startMove(f, e)}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (moveDragRef.current?.fieldId === f.id && moveDragRef.current.hasDragged) {
                                  moveDragRef.current = null
                                  return
                                }
                                removeField(f.id)
                              }}
                              title="Drag to move, click to remove"
                            >
                              <span className="px-1 truncate">
                                {f.fieldType === 'admin_text' ? f.presetValue : f.label}
                              </span>
                              <div
                                onMouseDown={(e) => startResize(f, e)}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-0 right-0 w-3 h-3 bg-white/90 border border-slate-400 cursor-nwse-resize rounded-tl"
                                title="Drag to resize"
                              />
                            </div>
                          ))}
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

      {pendingTextPlacement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Add Your Text</h2>
            <p className="text-sm text-slate-500 mb-4">
              This will be baked directly into the document — visible to everyone, not something signers fill in.
            </p>
            <textarea
              autoFocus
              placeholder="e.g. today's date, a reference number, a note…"
              value={pendingTextValue}
              onChange={(e) => setPendingTextValue(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleConfirmAdminText}
                disabled={!pendingTextValue.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                Place on Document
              </button>
              <button
                onClick={() => setPendingTextPlacement(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
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