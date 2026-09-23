'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CvEditor from './CvEditor'

type Candidate = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  cv_url: string | null
  tags: string[]
  notes: string | null
  source: string | null
  formatted_cv: any
  created_at: string
}

const SOURCE_OPTIONS = ['Indeed', 'Referral', 'Apollo', 'Website', 'Other']

function getWhatsAppLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

export default function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [uploadingCv, setUploadingCv] = useState(false)
  const [parsingCv, setParsingCv] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [pendingCvPath, setPendingCvPath] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    tags: '',
    source: '',
  })
  const [savingCandidate, setSavingCandidate] = useState(false)

  const [showManualForm, setShowManualForm] = useState(false)

  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)
  const [bulkResultMsg, setBulkResultMsg] = useState<string | null>(null)

  useEffect(() => {
    loadCandidates()
  }, [])

  async function loadCandidates() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: false })
    setCandidates(data || [])
    setLoading(false)
  }

  const allTags = Array.from(new Set(candidates.flatMap((c) => c.tags || []))).sort()

  const filteredCandidates = candidates.filter((c) => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.phone || '').toLowerCase().includes(term)
    const matchesTag = !tagFilter || (c.tags || []).includes(tagFilter)
    return matchesSearch && matchesTag
  })

  async function handleCvUpload(file: File) {
    setUploadingCv(true)
    try {
      const supabase = createClient()
      const path = `cvs/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('candidate-cvs').upload(path, file)
      if (uploadError) throw uploadError

      setPendingCvPath(path)
      setParsingCv(true)

      // Extract text from the PDF in the browser using pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n'
      }

      const res = await fetch('/api/parse-cv-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: fullText }),
      })
      const result = await res.json()

      if (!res.ok) {
        alert('Could not auto-extract details: ' + (result.error || 'unknown error') + '. You can still fill this in manually below.')
      }

      setReviewForm({
        first_name: result.first_name || '',
        last_name: result.last_name || '',
        email: result.email || '',
        phone: result.phone || '',
        address: result.address || '',
        tags: '',
        source: '',
      })
      setShowReviewForm(true)
    } catch (err: any) {
      alert('Upload failed: ' + (err?.message || 'unknown error'))
    } finally {
      setUploadingCv(false)
      setParsingCv(false)
    }
  }

  function openManualAdd() {
    setPendingCvPath(null)
    setReviewForm({ first_name: '', last_name: '', email: '', phone: '', address: '', tags: '', source: '' })
    setShowManualForm(true)
  }

  async function handleSaveCandidate() {
    const supabase = createClient()

    // Check for an existing candidate with the same email or phone
    // before saving, so the same person doesn't end up added twice
    const orConditions: string[] = []
    if (reviewForm.email.trim()) orConditions.push(`email.eq.${reviewForm.email.trim()}`)
    if (reviewForm.phone.trim()) orConditions.push(`phone.eq.${reviewForm.phone.trim()}`)

    if (orConditions.length > 0) {
      const { data: possibleDupes } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, phone')
        .or(orConditions.join(','))

      if (possibleDupes && possibleDupes.length > 0) {
        const existing = possibleDupes[0]
        const existingName = [existing.first_name, existing.last_name].filter(Boolean).join(' ') || 'this candidate'
        const confirmed = confirm(
          `This looks like it might already be ${existingName} (${existing.email || existing.phone}).\n\nSave as a new candidate anyway?`
        )
        if (!confirmed) return
      }
    }

    setSavingCandidate(true)

    const tags = reviewForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        first_name: reviewForm.first_name || null,
        last_name: reviewForm.last_name || null,
        email: reviewForm.email || null,
        phone: reviewForm.phone || null,
        address: reviewForm.address || null,
        cv_url: pendingCvPath,
        tags,
        source: reviewForm.source || null,
      })
      .select()
      .single()

    setSavingCandidate(false)

    if (!error && data) {
      setCandidates([data, ...candidates])
      setShowReviewForm(false)
      setShowManualForm(false)
      setPendingCvPath(null)
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleViewCv(candidate: Candidate) {
    if (!candidate.cv_url) return
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('candidate-cvs').createSignedUrl(candidate.cv_url, 300)
    if (error || !data) {
      alert('Could not open CV: ' + (error?.message || 'unknown error'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const [viewingNotesFor, setViewingNotesFor] = useState<Candidate | null>(null)
  const [formattingCandidate, setFormattingCandidate] = useState<Candidate | null>(null)
  const [candidateActivity, setCandidateActivity] = useState<
    { id: string; kind: 'note' | 'event'; text: string; created_at: string }[]
  >([])
  const [newNoteText, setNewNoteText] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  async function openNotes(candidate: Candidate) {
    setViewingNotesFor(candidate)
    setLoadingNotes(true)
    const supabase = createClient()
    const [notesResult, logResult] = await Promise.all([
      supabase.from('notes').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('*')
        .eq('candidate_id', candidate.id)
        .order('created_at', { ascending: false }),
    ])

    const merged = [
      ...(notesResult.data || []).map((n: any) => ({
        id: n.id,
        kind: 'note' as const,
        text: n.note_text,
        created_at: n.created_at,
      })),
      ...(logResult.data || []).map((e: any) => ({
        id: e.id,
        kind: 'event' as const,
        text: e.description,
        created_at: e.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setCandidateActivity(merged)
    setLoadingNotes(false)
  }

  async function handleAddNote() {
    if (!viewingNotesFor || !newNoteText.trim()) return
    setSavingNote(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .insert({ candidate_id: viewingNotesFor.id, note_text: newNoteText.trim() })
      .select()
      .single()
    setSavingNote(false)
    if (!error && data) {
      setCandidateActivity([
        { id: data.id, kind: 'note', text: data.note_text, created_at: data.created_at },
        ...candidateActivity,
      ])
      setNewNoteText('')
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleDeleteCandidate(id: string) {
    if (!confirm('Delete this candidate?')) return
    const supabase = createClient()
    const { error } = await supabase.from('candidates').delete().eq('id', id)
    if (!error) setCandidates(candidates.filter((c) => c.id !== id))
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const filteredIds = filteredCandidates.map((c) => c.id)
    const allSelected = filteredIds.every((id) => selectedIds.has(id))
    setSelectedIds(allSelected ? new Set() : new Set(filteredIds))
  }

  async function handleSendBulkEmail() {
    const selectedCandidates = candidates.filter((c) => selectedIds.has(c.id) && c.email)
    if (selectedCandidates.length === 0) {
      setBulkResultMsg('None of the selected candidates have an email address on file.')
      return
    }

    setSendingBulk(true)
    setBulkResultMsg(null)

    try {
      const res = await fetch('/api/candidates/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: selectedCandidates.map((c) => c.email),
          subject: bulkSubject,
          body: bulkBody,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Send failed')
      setBulkResultMsg(`Sent to ${result.sentCount} candidates${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}.`)
    } catch (err: any) {
      setBulkResultMsg('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSendingBulk(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <label className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition cursor-pointer">
            {uploadingCv ? (parsingCv ? 'Reading CV…' : 'Uploading…') : '+ Upload CV'}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploadingCv}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleCvUpload(file)
              }}
            />
          </label>
          <button
            onClick={openManualAdd}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            + Add Manually
          </button>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={() => {
              setBulkResultMsg(null)
              setShowBulkEmail(true)
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Email Selected ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All skills</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      </div>

      {filteredCandidates.length > 0 && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
          <input
            type="checkbox"
            checked={filteredCandidates.every((c) => selectedIds.has(c.id))}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-slate-300"
          />
          Select all ({filteredCandidates.length})
        </label>
      )}

      <div className="space-y-3">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start gap-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(candidate.id)}
                onChange={() => toggleSelect(candidate.id)}
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900">
                    {[candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || 'Unnamed candidate'}
                  </p>
                  {(candidate.tags || []).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      #{tag}
                    </span>
                  ))}
                  {candidate.source && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      via {candidate.source}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {candidate.email} {candidate.phone && `· ${candidate.phone}`}
                  </span>
                  {candidate.phone && (
                    <a
                      href={getWhatsAppLink(candidate.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-green-600 bg-green-50 rounded-full px-2 py-0.5"
                    >
                      WhatsApp
                    </a>
                  )}
                </p>
                {candidate.address && <p className="text-xs text-slate-400 mt-0.5">{candidate.address}</p>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {candidate.cv_url && (
                <button
                  onClick={() => handleViewCv(candidate)}
                  className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
                >
                  View CV
                </button>
              )}
              <button
                onClick={() => setFormattingCandidate(candidate)}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
              >
                Format CV
              </button>
              <button
                onClick={() => openNotes(candidate)}
                className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
              >
                Activity
              </button>
              <button
                onClick={() => handleDeleteCandidate(candidate.id)}
                className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredCandidates.length === 0 && <p className="text-slate-500">No candidates found.</p>}
      </div>

      {(showReviewForm || showManualForm) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">{showReviewForm ? 'Review Extracted Details' : 'Add Candidate'}</h2>
            {showReviewForm && (
              <p className="text-sm text-slate-500 mb-4">
                Check these details before saving — CV parsing isn't always perfect.
              </p>
            )}
            <div className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="First name"
                  value={reviewForm.first_name}
                  onChange={(e) => setReviewForm({ ...reviewForm, first_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Last name"
                  value={reviewForm.last_name}
                  onChange={(e) => setReviewForm({ ...reviewForm, last_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <input
                placeholder="Email"
                value={reviewForm.email}
                onChange={(e) => setReviewForm({ ...reviewForm, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={reviewForm.phone}
                onChange={(e) => setReviewForm({ ...reviewForm, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Address"
                value={reviewForm.address}
                onChange={(e) => setReviewForm({ ...reviewForm, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Skills/tags, comma separated (e.g. fire & security, health and safety)"
                value={reviewForm.tags}
                onChange={(e) => setReviewForm({ ...reviewForm, tags: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={reviewForm.source}
                onChange={(e) => setReviewForm({ ...reviewForm, source: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Where did they come from? (optional)</option>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveCandidate}
                disabled={savingCandidate}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {savingCandidate ? 'Saving…' : 'Save Candidate'}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false)
                  setShowManualForm(false)
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkEmail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-1">Email {selectedIds.size} Candidates</h2>
            <p className="text-sm text-slate-500 mb-4">This sends the same email to everyone selected.</p>
            <input
              placeholder="Subject"
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <textarea
              placeholder="Write your message…"
              value={bulkBody}
              onChange={(e) => setBulkBody(e.target.value)}
              rows={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            {bulkResultMsg && <p className="mt-3 text-sm font-semibold text-slate-700">{bulkResultMsg}</p>}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSendBulkEmail}
                disabled={sendingBulk || !bulkSubject.trim() || !bulkBody.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {sendingBulk ? 'Sending…' : 'Send'}
              </button>
              <button
                onClick={() => setShowBulkEmail(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingNotesFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">
                Activity — {[viewingNotesFor.first_name, viewingNotesFor.last_name].filter(Boolean).join(' ')}
              </h2>
              <button onClick={() => setViewingNotesFor(null)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-1">
              Notes and everything the system has logged for this candidate, in one place.
            </p>

            <div className="mt-4">
              <textarea
                placeholder="Add a note — e.g. spoke to them Tuesday, keen but wants remote work…"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddNote}
                disabled={savingNote || !newNoteText.trim()}
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {savingNote ? 'Adding…' : 'Add Note'}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {loadingNotes ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : candidateActivity.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                candidateActivity.map((item) =>
                  item.kind === 'note' ? (
                    <div key={item.id} className="border-l-2 border-orange-300 pl-3">
                      <p className="text-sm text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ) : (
                    <div key={item.id} className="border-l-2 border-slate-200 pl-3">
                      <p className="text-xs text-slate-500">→ {item.text}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}

      {formattingCandidate && (
        <CvEditor
          candidateId={formattingCandidate.id}
          candidateCvPath={formattingCandidate.cv_url}
          existingFormattedCv={formattingCandidate.formatted_cv}
          onClose={() => setFormattingCandidate(null)}
        />
      )}
    </div>
  )
}