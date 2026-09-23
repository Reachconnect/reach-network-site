'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lead = {
  id: string
  company_name: string
  contact_name: string | null
  contact_role: string | null
  contact_phone: string | null
  contact_email: string | null
  stage: string
  next_call_at: string | null
  next_call_note: string | null
  converted_client_id: string | null
  created_at: string
}

type Note = { id: string; kind: 'note' | 'event'; text: string; created_at: string }

const STAGES = ['new', 'contacted', 'interested', 'converted', 'lost']

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  converted: 'Converted',
  lost: 'Lost',
}

const STAGE_STYLES: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600',
  contacted: 'bg-blue-100 text-blue-700',
  interested: 'bg-orange-100 text-orange-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
}

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showAddLead, setShowAddLead] = useState(false)
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_name: '',
    contact_role: '',
    contact_phone: '',
    contact_email: '',
  })

  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [leadNotes, setLeadNotes] = useState<Note[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [snoozingLead, setSnoozingLead] = useState<Lead | null>(null)
  const [snoozeDate, setSnoozeDate] = useState('')
  const [snoozeNote, setSnoozeNote] = useState('')
  const [savingSnooze, setSavingSnooze] = useState(false)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  const searchedLeads = leads.filter((lead) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      lead.company_name.toLowerCase().includes(term) || (lead.contact_name || '').toLowerCase().includes(term)
    )
  })

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

  function handleDropOnColumn(stage: string) {
    setDragOverStage(null)
    if (!draggedLeadId) return
    const lead = leads.find((l) => l.id === draggedLeadId)
    setDraggedLeadId(null)
    if (!lead || lead.stage === stage) return

    if (stage === 'converted') {
      handleConvertToClient(lead)
    } else {
      handleStageChange(lead, stage)
    }
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data, error } = await supabase.from('leads').insert(newLead).select().single()
    if (!error && data) {
      setLeads([data, ...leads])
      setNewLead({ company_name: '', contact_name: '', contact_role: '', contact_phone: '', contact_email: '' })
      setShowAddLead(false)
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleDeleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    const supabase = createClient()
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (!error) setLeads(leads.filter((l) => l.id !== id))
  }

  async function logActivity(leadId: string, eventType: string, description: string) {
    const supabase = createClient()
    await supabase.from('activity_log').insert({ lead_id: leadId, event_type: eventType, description })
  }

  async function handleStageChange(lead: Lead, newStage: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update({ stage: newStage })
      .eq('id', lead.id)
      .select()
      .single()
    if (!error && data) {
      setLeads(leads.map((l) => (l.id === lead.id ? data : l)))
      if (viewingLead?.id === lead.id) setViewingLead(data)
      logActivity(lead.id, 'stage_change', `Moved to ${STAGE_LABELS[newStage] || newStage}`)
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleConvertToClient(lead: Lead) {
    if (!confirm(`Convert "${lead.company_name}" into a client? This creates a new entry in your Clients tab.`)) return

    const supabase = createClient()
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({ company_name: lead.company_name })
      .select()
      .single()
    if (clientError || !client) {
      alert(clientError?.message || 'Could not create client')
      return
    }

    if (lead.contact_name) {
      await supabase.from('client_contacts').insert({
        client_id: client.id,
        name: lead.contact_name,
        role_label: lead.contact_role,
        email: lead.contact_email,
        phone: lead.contact_phone,
      })
    }

    const { data: updatedLead, error: leadError } = await supabase
      .from('leads')
      .update({ stage: 'converted', converted_client_id: client.id })
      .eq('id', lead.id)
      .select()
      .single()

    if (!leadError && updatedLead) {
      setLeads(leads.map((l) => (l.id === lead.id ? updatedLead : l)))
      setViewingLead(updatedLead)
      logActivity(lead.id, 'converted', `Converted to client`)
      alert(`${lead.company_name} has been added to your Clients tab.`)
    }
  }

  async function openLead(lead: Lead) {
    setViewingLead(lead)
    setLoadingNotes(true)
    const supabase = createClient()
    const [notesResult, logResult] = await Promise.all([
      supabase.from('notes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }),
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

    setLeadNotes(merged as any)
    setLoadingNotes(false)
  }

  async function handleAddNote() {
    if (!viewingLead || !newNoteText.trim()) return
    setSavingNote(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .insert({ lead_id: viewingLead.id, note_text: newNoteText.trim() })
      .select()
      .single()
    setSavingNote(false)
    if (!error && data) {
      setLeadNotes([{ id: data.id, kind: 'note', text: data.note_text, created_at: data.created_at }, ...leadNotes])
      setNewNoteText('')
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleSaveSnooze() {
    if (!snoozingLead || !snoozeDate) return
    setSavingSnooze(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update({ next_call_at: new Date(snoozeDate).toISOString(), next_call_note: snoozeNote || null })
      .eq('id', snoozingLead.id)
      .select()
      .single()
    setSavingSnooze(false)
    if (!error && data) {
      setLeads(leads.map((l) => (l.id === snoozingLead.id ? data : l)))
      if (viewingLead?.id === snoozingLead.id) setViewingLead(data)
      setSnoozingLead(null)
      setSnoozeDate('')
      setSnoozeNote('')
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleClearSnooze(lead: Lead) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update({ next_call_at: null, next_call_note: null })
      .eq('id', lead.id)
      .select()
      .single()
    if (!error && data) {
      setLeads(leads.map((l) => (l.id === lead.id ? data : l)))
      if (viewingLead?.id === lead.id) setViewingLead(data)
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <input
          placeholder="Search leads…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
        />
        <button
          onClick={() => setShowAddLead(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add Lead
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageLeads = searchedLeads.filter((l) => l.stage === stage)
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStage(stage)
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => {
                e.preventDefault()
                handleDropOnColumn(stage)
              }}
              className={`shrink-0 w-64 rounded-xl p-2 transition-colors ${
                dragOverStage === stage ? 'bg-orange-100 ring-2 ring-orange-300' : 'bg-slate-100'
              }`}
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-2 py-1.5">
                {STAGE_LABELS[stage]} ({stageLeads.length})
              </p>
              <div className="space-y-2 min-h-[40px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggedLeadId(lead.id)}
                    onClick={() => openLead(lead)}
                    className="bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-orange-300"
                  >
                    <p className="text-sm font-semibold text-slate-900">{lead.company_name}</p>
                    {(lead.contact_name || lead.contact_role) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {lead.contact_name} {lead.contact_role && `· ${lead.contact_role}`}
                      </p>
                    )}
                    {lead.next_call_at && (
                      <p className="text-xs font-semibold text-indigo-600 mt-1.5">
                        Call{' '}
                        {new Date(lead.next_call_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showAddLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Lead</h2>
            <form onSubmit={handleAddLead} className="space-y-3">
              <input
                placeholder="Company name"
                required
                value={newLead.company_name}
                onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Contact name"
                value={newLead.contact_name}
                onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Contact role"
                value={newLead.contact_role}
                onChange={(e) => setNewLead({ ...newLead, contact_role: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Phone"
                value={newLead.contact_phone}
                onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Email"
                value={newLead.contact_email}
                onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">{viewingLead.company_name}</h2>
              <button onClick={() => setViewingLead(null)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {viewingLead.contact_name} {viewingLead.contact_role && `· ${viewingLead.contact_role}`}
            </p>

            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <select
                value={viewingLead.stage}
                onChange={(e) => handleStageChange(viewingLead, e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
              {viewingLead.stage !== 'converted' && (
                <button
                  onClick={() => handleConvertToClient(viewingLead)}
                  className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-3 py-1.5"
                >
                  Convert to Client
                </button>
              )}
              <button
                onClick={() => {
                  handleDeleteLead(viewingLead.id)
                  setViewingLead(null)
                }}
                className="text-xs font-semibold text-red-600 px-3 py-1.5 ml-auto"
              >
                Delete
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              {viewingLead.next_call_at ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-indigo-600">
                    Call back{' '}
                    {new Date(viewingLead.next_call_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {viewingLead.next_call_note && ` — ${viewingLead.next_call_note}`}
                  </p>
                  <button
                    onClick={() => handleClearSnooze(viewingLead)}
                    className="text-xs text-slate-400 underline"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSnoozingLead(viewingLead)
                    setSnoozeDate('')
                    setSnoozeNote('')
                  }}
                  className="text-sm font-semibold text-orange-600"
                >
                  + Set a call-back reminder
                </button>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500">
                {viewingLead.contact_email} {viewingLead.contact_phone && `· ${viewingLead.contact_phone}`}
              </p>
            </div>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Log a call / note</label>
            <textarea
              placeholder="e.g. Spoke to Sarah — not hiring right now, said to call back in the new year"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
            />
            <button
              onClick={handleAddNote}
              disabled={savingNote || !newNoteText.trim()}
              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {savingNote ? 'Adding…' : 'Add Note'}
            </button>

            <div className="mt-5 space-y-3">
              {loadingNotes ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : leadNotes.length === 0 ? (
                <p className="text-sm text-slate-400">No call history yet.</p>
              ) : (
                leadNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`border-l-2 pl-3 ${note.kind === 'note' ? 'border-orange-300' : 'border-slate-200'}`}
                  >
                    <p className={note.kind === 'note' ? 'text-sm text-slate-700' : 'text-xs text-slate-500'}>
                      {note.kind === 'event' ? '→ ' : ''}
                      {note.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(note.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {snoozingLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Set Call-Back Reminder</h2>
            <p className="text-sm text-slate-500 mb-4">{snoozingLead.company_name}</p>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Call back on</label>
            <input
              type="date"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            />

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Note (optional)</label>
            <input
              placeholder="e.g. said to call back after their busy period"
              value={snoozeNote}
              onChange={(e) => setSnoozeNote(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
            />

            <p className="text-xs text-slate-400 mt-3">
              You'll get an email reminder on this date — no need to keep checking back manually.
            </p>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveSnooze}
                disabled={savingSnooze || !snoozeDate}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {savingSnooze ? 'Saving…' : 'Set Reminder'}
              </button>
              <button
                onClick={() => setSnoozingLead(null)}
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