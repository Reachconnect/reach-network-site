'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Client = {
  id: string
  company_name: string
  notes: string | null
  billing_email: string | null
  created_at: string
}

type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string | null
  status: string
  billing_email: string
  total_amount: number
  pdf_url: string | null
}

type Contact = {
  id: string
  client_id: string
  name: string
  email: string | null
  phone: string | null
  role_label: string | null
}

type Vacancy = {
  id: string
  client_id: string
  title: string
  description: string | null
  location: string | null
  salary: string | null
  status: string
  created_at: string
}

type CandidateLite = { id: string; first_name: string | null; last_name: string | null; email: string | null }

type Assignment = {
  id: string
  vacancy_id: string
  candidate_id: string
  stage: string
  interview_datetime: string | null
  interview_type: string | null
  interview_address: string | null
  interview_link: string | null
  fee_amount: number | null
  fee_status: string | null
  stage_updated_at: string | null
  reminder_at: string | null
  reminder_note: string | null
  candidates?: CandidateLite
}

const ASSIGNMENT_STAGES = ['assigned', 'cv_sent', 'interview', 'placed', 'rejected']
const ASSIGNMENT_STAGE_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  cv_sent: 'CV Sent',
  interview: 'Interview',
  placed: 'Placed',
  rejected: 'Rejected',
}

export default function ClientsTab() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showAddClient, setShowAddClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientNotes, setNewClientNotes] = useState('')
  const [newClientBillingEmail, setNewClientBillingEmail] = useState('')

  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailTab, setDetailTab] = useState<
    'vacancies' | 'contacts' | 'awaiting_feedback' | 'placed' | 'invoices' | 'activity'
  >('vacancies')
  const [clientActivity, setClientActivity] = useState<{ id: string; description: string; created_at: string }[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [selectedForInvoice, setSelectedForInvoice] = useState<Set<string>>(new Set())
  const [invoiceBillingEmail, setInvoiceBillingEmail] = useState('')
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  const [snoozingAssignment, setSnoozingAssignment] = useState<Assignment | null>(null)
  const [snoozeDate, setSnoozeDate] = useState('')
  const [snoozeNote, setSnoozeNote] = useState('')
  const [savingSnooze, setSavingSnooze] = useState(false)

  const [showAddContact, setShowAddContact] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', role_label: '' })

  const [showAddVacancy, setShowAddVacancy] = useState(false)
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null)
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    status: 'open',
  })

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [allCandidates, setAllCandidates] = useState<CandidateLite[]>([])
  const [assigningVacancyId, setAssigningVacancyId] = useState<string | null>(null)
  const [draggedAssignmentId, setDraggedAssignmentId] = useState<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null) // `${vacancyId}-${stage}`
  const [candidateSearch, setCandidateSearch] = useState('')

  const [schedulingAssignment, setSchedulingAssignment] = useState<Assignment | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ datetime: '', type: 'teams', address: '', link: '' })
  const [sendingInvite, setSendingInvite] = useState(false)

  const [recordingFeeFor, setRecordingFeeFor] = useState<Assignment | null>(null)
  const [feeForm, setFeeForm] = useState({ amount: '', status: 'pending' })
  const [savingFee, setSavingFee] = useState(false)

  const [viewingNotesForAssignment, setViewingNotesForAssignment] = useState<Assignment | null>(null)
  const [assignmentNotes, setAssignmentNotes] = useState<{ id: string; note_text: string; created_at: string }[]>([])
  const [newAssignmentNote, setNewAssignmentNote] = useState('')
  const [loadingAssignmentNotes, setLoadingAssignmentNotes] = useState(false)
  const [savingAssignmentNote, setSavingAssignmentNote] = useState(false)

  useEffect(() => {
    loadClients()
    loadAllCandidates()
  }, [])

  async function loadAllCandidates() {
    const supabase = createClient()
    const { data } = await supabase.from('candidates').select('id, first_name, last_name, email').order('first_name')
    setAllCandidates(data || [])
  }

  async function loadClients() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('clients').select('*').order('company_name', { ascending: true })
    setClients(data || [])
    setLoading(false)
  }

  const filteredClients = clients.filter((c) =>
    c.company_name.toLowerCase().includes(search.trim().toLowerCase())
  )

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('clients')
      .insert({
        company_name: newClientName,
        notes: newClientNotes || null,
        billing_email: newClientBillingEmail || null,
      })
      .select()
      .single()

    if (!error && data) {
      setClients([...clients, data].sort((a, b) => a.company_name.localeCompare(b.company_name)))
      setNewClientName('')
      setNewClientNotes('')
      setNewClientBillingEmail('')
      setShowAddClient(false)
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleDeleteClient(id: string) {
    if (!confirm('Delete this client? This also removes their contacts and vacancies.')) return
    const supabase = createClient()
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) setClients(clients.filter((c) => c.id !== id))
  }

  async function openClientDetail(client: Client) {
    setViewingClient(client)
    setDetailTab('vacancies')
    setInvoiceBillingEmail(client.billing_email || '')
    setLoadingDetail(true)
    const supabase = createClient()

    const [contactsResult, vacanciesResult, invoicesResult] = await Promise.all([
      supabase.from('client_contacts').select('*').eq('client_id', client.id).order('name'),
      supabase.from('vacancies').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    ])

    setContacts(contactsResult.data || [])
    setVacancies(vacanciesResult.data || [])
    setInvoices(invoicesResult.data || [])

    const vacancyIds = (vacanciesResult.data || []).map((v) => v.id)
    if (vacancyIds.length > 0) {
      const { data: assignmentsData } = await supabase
        .from('vacancy_assignments')
        .select('*, candidates(id, first_name, last_name, email)')
        .in('vacancy_id', vacancyIds)
      setAssignments(assignmentsData || [])
    } else {
      setAssignments([])
    }

    setLoadingActivity(true)
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
    setClientActivity(activityData || [])
    setLoadingActivity(false)

    setLoadingDetail(false)
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!viewingClient) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('client_contacts')
      .insert({ client_id: viewingClient.id, ...contactForm })
      .select()
      .single()

    if (!error && data) {
      setContacts([...contacts, data])
      setContactForm({ name: '', email: '', phone: '', role_label: '' })
      setShowAddContact(false)
      logActivity({
        clientId: viewingClient.id,
        eventType: 'contact_added',
        description: `Added contact: ${data.name}${data.role_label ? ` (${data.role_label})` : ''}`,
      })
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleDeleteContact(id: string) {
    if (!confirm('Remove this contact?')) return
    const supabase = createClient()
    const { error } = await supabase.from('client_contacts').delete().eq('id', id)
    if (!error) setContacts(contacts.filter((c) => c.id !== id))
  }

  function openNewVacancy() {
    setEditingVacancy(null)
    setVacancyForm({ title: '', description: '', location: '', salary: '', status: 'open' })
    setShowAddVacancy(true)
  }

  function openEditVacancy(vacancy: Vacancy) {
    setEditingVacancy(vacancy)
    setVacancyForm({
      title: vacancy.title,
      description: vacancy.description || '',
      location: vacancy.location || '',
      salary: vacancy.salary || '',
      status: vacancy.status,
    })
    setShowAddVacancy(true)
  }

  async function handleSaveVacancy(e: React.FormEvent) {
    e.preventDefault()
    if (!viewingClient) return
    const supabase = createClient()

    if (editingVacancy) {
      const { data, error } = await supabase
        .from('vacancies')
        .update(vacancyForm)
        .eq('id', editingVacancy.id)
        .select()
        .single()
      if (!error && data) {
        setVacancies(vacancies.map((v) => (v.id === editingVacancy.id ? data : v)))
        setShowAddVacancy(false)
      } else if (error) {
        alert(error.message)
      }
    } else {
      const { data, error } = await supabase
        .from('vacancies')
        .insert({ client_id: viewingClient.id, ...vacancyForm })
        .select()
        .single()
      if (!error && data) {
        setVacancies([data, ...vacancies])
        setShowAddVacancy(false)
        logActivity({
          clientId: viewingClient.id,
          eventType: 'vacancy_opened',
          description: `Opened vacancy: ${data.title}`,
        })
      } else if (error) {
        alert(error.message)
      }
    }
  }

  async function handleDeleteVacancy(id: string) {
    if (!confirm('Delete this vacancy?')) return
    const supabase = createClient()
    const { error } = await supabase.from('vacancies').delete().eq('id', id)
    if (!error) setVacancies(vacancies.filter((v) => v.id !== id))
  }

  function assignmentsForVacancy(vacancyId: string) {
    return assignments.filter((a) => a.vacancy_id === vacancyId)
  }

  async function logActivity(opts: {
    candidateId?: string | null
    clientId?: string | null
    leadId?: string | null
    eventType: string
    description: string
  }) {
    const supabase = createClient()
    await supabase.from('activity_log').insert({
      candidate_id: opts.candidateId || null,
      client_id: opts.clientId || null,
      lead_id: opts.leadId || null,
      event_type: opts.eventType,
      description: opts.description,
    })
  }

  async function handleAssignCandidate(vacancyId: string, candidateId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancy_assignments')
      .insert({ vacancy_id: vacancyId, candidate_id: candidateId, stage: 'assigned' })
      .select('*, candidates(id, first_name, last_name, email)')
      .single()
    if (!error && data) {
      setAssignments([...assignments, data])
      setAssigningVacancyId(null)
      setCandidateSearch('')

      const vacancy = vacancies.find((v) => v.id === vacancyId)
      const candidateName = [data.candidates?.first_name, data.candidates?.last_name].filter(Boolean).join(' ')
      logActivity({
        candidateId,
        clientId: viewingClient?.id,
        eventType: 'assigned',
        description: `${candidateName} assigned to ${vacancy?.title || 'a vacancy'}`,
      })
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleStageChange(assignment: Assignment, newStage: string) {
    if (newStage === 'interview' && !assignment.interview_datetime) {
      setSchedulingAssignment(assignment)
      setScheduleForm({ datetime: '', type: 'teams', address: '', link: '' })
      return
    }
    if (newStage === 'placed' && !assignment.fee_amount) {
      setRecordingFeeFor(assignment)
      setFeeForm({ amount: '', status: 'pending' })
      return
    }
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancy_assignments')
      .update({ stage: newStage, stage_updated_at: new Date().toISOString() })
      .eq('id', assignment.id)
      .select('*, candidates(id, first_name, last_name, email)')
      .single()
    if (!error && data) {
      setAssignments(assignments.map((a) => (a.id === assignment.id ? data : a)))

      const vacancy = vacancies.find((v) => v.id === assignment.vacancy_id)
      const candidateName = [data.candidates?.first_name, data.candidates?.last_name].filter(Boolean).join(' ')
      logActivity({
        candidateId: assignment.candidate_id,
        clientId: viewingClient?.id,
        eventType: 'stage_change',
        description: `${candidateName} moved to ${ASSIGNMENT_STAGE_LABELS[newStage] || newStage} for ${vacancy?.title || 'a vacancy'}`,
      })
    } else if (error) {
      alert(error.message)
    }
  }

  function handleDropOnAssignmentColumn(newStage: string) {
    setDragOverKey(null)
    if (!draggedAssignmentId) return
    const assignment = assignments.find((a) => a.id === draggedAssignmentId)
    setDraggedAssignmentId(null)
    if (!assignment || assignment.stage === newStage) return
    handleStageChange(assignment, newStage)
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm('Remove this candidate from the vacancy?')) return
    const supabase = createClient()
    const { error } = await supabase.from('vacancy_assignments').delete().eq('id', id)
    if (!error) setAssignments(assignments.filter((a) => a.id !== id))
  }

  async function handleSendInterviewInvite() {
    if (!schedulingAssignment) return
    if (!scheduleForm.datetime) return alert('Please pick a date and time.')
    if (scheduleForm.type === 'in_person' && !scheduleForm.address.trim()) {
      return alert('Please enter the interview address.')
    }

    setSendingInvite(true)
    try {
      const res = await fetch('/api/schedule-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: schedulingAssignment.id,
          datetime: new Date(scheduleForm.datetime).toISOString(),
          type: scheduleForm.type,
          address: scheduleForm.address,
          link: scheduleForm.link,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to schedule')

      setAssignments(
        assignments.map((a) =>
          a.id === schedulingAssignment.id
            ? {
                ...a,
                stage: 'interview',
                interview_datetime: new Date(scheduleForm.datetime).toISOString(),
                interview_type: scheduleForm.type,
                interview_address: scheduleForm.type === 'in_person' ? scheduleForm.address : null,
                interview_link: scheduleForm.type === 'teams' ? scheduleForm.link : null,
              }
            : a
        )
      )
      setSchedulingAssignment(null)

      const vacancy = vacancies.find((v) => v.id === schedulingAssignment.vacancy_id)
      const candidateName = [
        schedulingAssignment.candidates?.first_name,
        schedulingAssignment.candidates?.last_name,
      ]
        .filter(Boolean)
        .join(' ')
      logActivity({
        candidateId: schedulingAssignment.candidate_id,
        clientId: viewingClient?.id,
        eventType: 'interview_scheduled',
        description: `Interview scheduled for ${candidateName} — ${vacancy?.title || 'a vacancy'} on ${new Date(scheduleForm.datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      })
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleSaveFee() {
    if (!recordingFeeFor) return
    setSavingFee(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancy_assignments')
      .update({
        stage: 'placed',
        fee_amount: feeForm.amount ? Number(feeForm.amount) : null,
        fee_status: feeForm.status,
        placed_at: new Date().toISOString(),
        stage_updated_at: new Date().toISOString(),
      })
      .eq('id', recordingFeeFor.id)
      .select('*, candidates(id, first_name, last_name, email)')
      .single()
    setSavingFee(false)
    if (!error && data) {
      setAssignments(assignments.map((a) => (a.id === recordingFeeFor.id ? data : a)))
      setRecordingFeeFor(null)

      const vacancy = vacancies.find((v) => v.id === recordingFeeFor.vacancy_id)
      const candidateName = [data.candidates?.first_name, data.candidates?.last_name].filter(Boolean).join(' ')
      logActivity({
        candidateId: recordingFeeFor.candidate_id,
        clientId: viewingClient?.id,
        eventType: 'placement',
        description: `${candidateName} placed at ${vacancy?.title || 'a vacancy'}${feeForm.amount ? ` — fee £${Number(feeForm.amount).toFixed(2)}` : ''}`,
      })
    } else if (error) {
      alert(error.message)
    }
  }

  async function openAssignmentNotes(assignment: Assignment) {
    setViewingNotesForAssignment(assignment)
    setLoadingAssignmentNotes(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('assignment_id', assignment.id)
      .order('created_at', { ascending: false })
    setAssignmentNotes(data || [])
    setLoadingAssignmentNotes(false)
  }

  async function handleAddAssignmentNote() {
    if (!viewingNotesForAssignment || !newAssignmentNote.trim()) return
    setSavingAssignmentNote(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .insert({ assignment_id: viewingNotesForAssignment.id, note_text: newAssignmentNote.trim() })
      .select()
      .single()
    setSavingAssignmentNote(false)
    if (!error && data) {
      setAssignmentNotes([data, ...assignmentNotes])
      setNewAssignmentNote('')
    } else if (error) {
      alert(error.message)
    }
  }

  function toggleInvoiceSelection(assignmentId: string) {
    setSelectedForInvoice((current) => {
      const next = new Set(current)
      if (next.has(assignmentId)) next.delete(assignmentId)
      else next.add(assignmentId)
      return next
    })
  }

  async function handleGenerateInvoice() {
    if (!viewingClient) return
    if (selectedForInvoice.size === 0) return alert('Select at least one placement to invoice.')
    if (!invoiceBillingEmail.trim()) return alert('Please enter a billing email address.')

    setGeneratingInvoice(true)
    try {
      const res = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: viewingClient.id,
          assignmentIds: Array.from(selectedForInvoice),
          billingEmail: invoiceBillingEmail.trim(),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to generate invoice')

      setAssignments(
        assignments.map((a) => (selectedForInvoice.has(a.id) ? { ...a, fee_status: 'invoiced' } : a))
      )
      const supabase = createClient()
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', viewingClient.id)
        .order('created_at', { ascending: false })
      setInvoices(invoicesData || [])

      setShowCreateInvoice(false)
      setSelectedForInvoice(new Set())
      logActivity({
        clientId: viewingClient.id,
        eventType: 'invoice',
        description: `Invoice ${result.invoiceNumber} generated — £${Number(result.totalAmount || 0).toFixed(2)}`,
      })
      alert(`Invoice ${result.invoiceNumber} generated and sent to ${invoiceBillingEmail}.`)
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setGeneratingInvoice(false)
    }
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)
      .select()
      .single()
    if (!error && data) {
      setInvoices(invoices.map((i) => (i.id === invoiceId ? data : i)))
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleViewInvoice(invoice: Invoice) {
    if (!invoice.pdf_url) return
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('invoices').createSignedUrl(invoice.pdf_url, 300)
    if (error || !data) {
      alert('Could not open invoice: ' + (error?.message || 'unknown error'))
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  function invoiceStatusBadge(status: string) {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-500',
      sent: 'bg-orange-100 text-orange-700',
      paid: 'bg-green-100 text-green-700',
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>{status}</span>
  }

  async function handleSaveSnooze() {
    if (!snoozingAssignment || !snoozeDate) return
    setSavingSnooze(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancy_assignments')
      .update({
        reminder_at: new Date(snoozeDate).toISOString(),
        reminder_note: snoozeNote || null,
      })
      .eq('id', snoozingAssignment.id)
      .select('*, candidates(id, first_name, last_name, email)')
      .single()
    setSavingSnooze(false)
    if (!error && data) {
      setAssignments(assignments.map((a) => (a.id === snoozingAssignment.id ? data : a)))
      setSnoozingAssignment(null)
      setSnoozeDate('')
      setSnoozeNote('')
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleClearSnooze(assignment: Assignment) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('vacancy_assignments')
      .update({ reminder_at: null, reminder_note: null })
      .eq('id', assignment.id)
      .select('*, candidates(id, first_name, last_name, email)')
      .single()
    if (!error && data) {
      setAssignments(assignments.map((a) => (a.id === assignment.id ? data : a)))
    }
  }

  function feeStatusBadge(status: string | null) {
    const styles: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-700',
      invoiced: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
    }
    const labels: Record<string, string> = { pending: 'Pending', invoiced: 'Invoiced', paid: 'Paid' }
    const key = status || 'pending'
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[key]}`}>{labels[key]}</span>
  }

  function stageBadge(stage: string) {
    const styles: Record<string, string> = {
      assigned: 'bg-slate-100 text-slate-600',
      cv_sent: 'bg-blue-100 text-blue-700',
      interview: 'bg-orange-100 text-orange-700',
      placed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-600',
    }
    const labels: Record<string, string> = {
      assigned: 'Assigned',
      cv_sent: 'CV Sent',
      interview: 'Interview',
      placed: 'Placed',
      rejected: 'Rejected',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[stage] || styles.assigned}`}>
        {labels[stage] || stage}
      </span>
    )
  }

  function vacancyStatusBadge(status: string) {
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-700',
      on_hold: 'bg-orange-100 text-orange-700',
      closed: 'bg-slate-100 text-slate-500',
    }
    const labels: Record<string, string> = { open: 'Open', on_hold: 'On Hold', closed: 'Closed' }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.open}`}>{labels[status] || status}</span>
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <input
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={() => setShowAddClient(true)}
          className="ml-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          + Add Client
        </button>
      </div>

      <div className="space-y-3">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center cursor-pointer hover:border-orange-300"
            onClick={() => openClientDetail(client)}
          >
            <div>
              <p className="font-semibold text-slate-900">{client.company_name}</p>
              {client.notes && <p className="text-sm text-slate-500 mt-0.5">{client.notes}</p>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteClient(client.id)
              }}
              className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
            >
              Delete
            </button>
          </div>
        ))}
        {filteredClients.length === 0 && <p className="text-slate-500">No clients found.</p>}
      </div>

      {showAddClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Client</h2>
            <form onSubmit={handleAddClient} className="space-y-3">
              <input
                placeholder="Company name"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Billing email (optional — e.g. accounts@client.com)"
                value={newClientBillingEmail}
                onChange={(e) => setNewClientBillingEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newClientNotes}
                onChange={(e) => setNewClientNotes(e.target.value)}
                rows={3}
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
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{viewingClient.company_name}</h2>
              <button onClick={() => setViewingClient(null)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setDetailTab('vacancies')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'vacancies' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Vacancies ({vacancies.length})
              </button>
              <button
                onClick={() => setDetailTab('awaiting_feedback')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'awaiting_feedback' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Awaiting Feedback ({assignments.filter((a) => a.stage === 'cv_sent').length})
              </button>
              <button
                onClick={() => setDetailTab('placed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'placed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Placed ({assignments.filter((a) => a.stage === 'placed').length})
              </button>
              <button
                onClick={() => setDetailTab('invoices')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'invoices' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setDetailTab('activity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'activity' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Activity
              </button>
              <button
                onClick={() => setDetailTab('contacts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${detailTab === 'contacts' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Contacts ({contacts.length})
              </button>
            </div>

            {loadingDetail ? (
              <p className="text-slate-500">Loading…</p>
            ) : detailTab === 'vacancies' ? (
              <div>
                <button
                  onClick={openNewVacancy}
                  className="mb-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  + Add Vacancy
                </button>
                <div className="space-y-3">
                  {vacancies.map((vacancy) => (
                    <div key={vacancy.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{vacancy.title}</p>
                            {vacancyStatusBadge(vacancy.status)}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            {vacancy.location} {vacancy.salary && `· ${vacancy.salary}`}
                          </p>
                          {vacancy.description && (
                            <p className="text-sm text-slate-500 mt-1">{vacancy.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => openEditVacancy(vacancy)}
                            className="text-sm text-slate-600 hover:text-slate-900 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVacancy(vacancy.id)}
                            className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                          Candidates assigned
                        </p>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {ASSIGNMENT_STAGES.map((stage) => {
                            const stageAssignments = assignmentsForVacancy(vacancy.id).filter(
                              (a) => a.stage === stage
                            )
                            const key = `${vacancy.id}-${stage}`
                            return (
                              <div
                                key={stage}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  setDragOverKey(key)
                                }}
                                onDragLeave={() => setDragOverKey(null)}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  handleDropOnAssignmentColumn(stage)
                                }}
                                className={`shrink-0 w-44 rounded-lg p-1.5 transition-colors ${
                                  dragOverKey === key ? 'bg-orange-100 ring-2 ring-orange-300' : 'bg-slate-50'
                                }`}
                              >
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1 py-1">
                                  {ASSIGNMENT_STAGE_LABELS[stage]} ({stageAssignments.length})
                                </p>
                                <div className="space-y-1.5 min-h-[30px]">
                                  {stageAssignments.map((assignment) => (
                                    <div
                                      key={assignment.id}
                                      draggable
                                      onDragStart={() => setDraggedAssignmentId(assignment.id)}
                                      className="bg-white rounded-lg border border-slate-200 p-2 cursor-grab active:cursor-grabbing shadow-sm"
                                    >
                                      <p className="text-xs font-semibold text-slate-800 truncate">
                                        {[assignment.candidates?.first_name, assignment.candidates?.last_name]
                                          .filter(Boolean)
                                          .join(' ') || 'Unknown candidate'}
                                      </p>
                                      {assignment.stage === 'interview' && assignment.interview_datetime && (
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                          {new Date(assignment.interview_datetime).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                          })}
                                        </p>
                                      )}
                                      {assignment.stage === 'placed' && assignment.fee_amount != null && (
                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                          £{Number(assignment.fee_amount).toFixed(2)}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        {assignment.stage === 'interview' && (
                                          <button
                                            onClick={() => {
                                              setSchedulingAssignment(assignment)
                                              setScheduleForm({
                                                datetime: assignment.interview_datetime
                                                  ? assignment.interview_datetime.slice(0, 16)
                                                  : '',
                                                type: assignment.interview_type || 'teams',
                                                address: assignment.interview_address || '',
                                                link: assignment.interview_link || '',
                                              })
                                            }}
                                            className="text-[10px] font-semibold text-orange-600"
                                          >
                                            Reschedule
                                          </button>
                                        )}
                                        {assignment.stage === 'placed' && (
                                          <button
                                            onClick={() => {
                                              setRecordingFeeFor(assignment)
                                              setFeeForm({
                                                amount: String(assignment.fee_amount ?? ''),
                                                status: assignment.fee_status || 'pending',
                                              })
                                            }}
                                            className="text-[10px] font-semibold text-slate-500 underline"
                                          >
                                            Fee
                                          </button>
                                        )}
                                        <button
                                          onClick={() => openAssignmentNotes(assignment)}
                                          className="text-[10px] font-semibold text-slate-500"
                                        >
                                          Notes
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAssignment(assignment.id)}
                                          className="text-[10px] text-red-500 font-semibold ml-auto"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {assigningVacancyId === vacancy.id ? (
                          <div className="mt-2 border border-slate-200 rounded-lg p-2">
                            <input
                              autoFocus
                              placeholder="Search candidates by name…"
                              value={candidateSearch}
                              onChange={(e) => setCandidateSearch(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm mb-1"
                            />
                            <div className="max-h-32 overflow-y-auto">
                              {allCandidates
                                .filter((c) => {
                                  const term = candidateSearch.trim().toLowerCase()
                                  if (!term) return true
                                  return `${c.first_name || ''} ${c.last_name || ''} ${c.email || ''}`
                                    .toLowerCase()
                                    .includes(term)
                                })
                                .slice(0, 20)
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => handleAssignCandidate(vacancy.id, c.id)}
                                    className="block w-full text-left px-2 py-1.5 text-sm hover:bg-slate-50 rounded"
                                  >
                                    {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}
                                  </button>
                                ))}
                            </div>
                            <button
                              onClick={() => {
                                setAssigningVacancyId(null)
                                setCandidateSearch('')
                              }}
                              className="text-xs text-slate-400 font-semibold mt-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningVacancyId(vacancy.id)}
                            className="mt-2 text-xs font-bold text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5"
                          >
                            + Assign Candidate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {vacancies.length === 0 && <p className="text-slate-500 text-sm">No vacancies yet.</p>}
                </div>
              </div>
            ) : detailTab === 'awaiting_feedback' ? (
              <div className="space-y-3">
                {assignments
                  .filter((a) => a.stage === 'cv_sent')
                  .map((a) => {
                    const vacancy = vacancies.find((v) => v.id === a.vacancy_id)
                    const daysWaiting = a.stage_updated_at
                      ? Math.floor((Date.now() - new Date(a.stage_updated_at).getTime()) / 86400000)
                      : null
                    return (
                      <div
                        key={a.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center flex-wrap gap-2"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {[a.candidates?.first_name, a.candidates?.last_name].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-sm text-slate-500">{vacancy?.title || 'Unknown vacancy'}</p>
                          {a.reminder_at ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-semibold text-indigo-600">
                                Reminder set for{' '}
                                {new Date(a.reminder_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <button
                                onClick={() => handleClearSnooze(a)}
                                className="text-xs text-slate-400 underline"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            daysWaiting !== null && (
                              <p
                                className={`text-xs mt-1 font-semibold ${daysWaiting >= 5 ? 'text-red-600' : 'text-slate-400'}`}
                              >
                                Waiting {daysWaiting} day{daysWaiting === 1 ? '' : 's'} for feedback
                              </p>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSnoozingAssignment(a)
                              setSnoozeDate('')
                              setSnoozeNote('')
                            }}
                            className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1.5"
                          >
                            Snooze
                          </button>
                          <select
                            value={a.stage}
                            onChange={(e) => handleStageChange(a, e.target.value)}
                            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white"
                          >
                            <option value="assigned">Assigned</option>
                            <option value="cv_sent">CV Sent</option>
                            <option value="interview">Interview</option>
                            <option value="placed">Placed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    )
                  })}
                {assignments.filter((a) => a.stage === 'cv_sent').length === 0 && (
                  <p className="text-slate-500 text-sm">Nothing awaiting feedback right now.</p>
                )}
              </div>
            ) : detailTab === 'placed' ? (
              <div className="space-y-3">
                {assignments
                  .filter((a) => a.stage === 'placed')
                  .map((a) => {
                    const vacancy = vacancies.find((v) => v.id === a.vacancy_id)
                    return (
                      <div
                        key={a.id}
                        className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {[a.candidates?.first_name, a.candidates?.last_name].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-sm text-slate-500">{vacancy?.title || 'Unknown vacancy'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.fee_amount != null && (
                            <p className="text-sm font-semibold text-slate-700">
                              £{Number(a.fee_amount).toFixed(2)}
                            </p>
                          )}
                          {feeStatusBadge(a.fee_status)}
                        </div>
                      </div>
                    )
                  })}
                {assignments.filter((a) => a.stage === 'placed').length === 0 && (
                  <p className="text-slate-500 text-sm">No placements yet.</p>
                )}
              </div>
            ) : detailTab === 'invoices' ? (
              <div>
                <button
                  onClick={() => {
                    setShowCreateInvoice(true)
                    setSelectedForInvoice(new Set())
                  }}
                  className="mb-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  + Create Invoice
                </button>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center flex-wrap gap-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                        <p className="text-sm text-slate-500">
                          {invoice.invoice_date} · £{Number(invoice.total_amount).toFixed(2)} ·{' '}
                          {invoice.billing_email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoiceStatusBadge(invoice.status)}
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5"
                        >
                          View
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkInvoicePaid(invoice.id)}
                            className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-3 py-1.5"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-slate-500 text-sm">No invoices yet.</p>}
                </div>
              </div>
            ) : detailTab === 'activity' ? (
              <div className="space-y-3">
                {loadingActivity ? (
                  <p className="text-slate-500 text-sm">Loading…</p>
                ) : clientActivity.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nothing logged yet for this client.</p>
                ) : (
                  clientActivity.map((item) => (
                    <div key={item.id} className="border-l-2 border-slate-200 pl-3">
                      <p className="text-sm text-slate-700">{item.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleString('en-GB', {
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
            ) : (
              <div>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="mb-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
                >
                  + Add Contact
                </button>
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {contact.name} {contact.role_label && <span className="text-sm font-normal text-slate-500">— {contact.role_label}</span>}
                        </p>
                        <p className="text-sm text-slate-500">
                          {contact.email} {contact.phone && `· ${contact.phone}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {contacts.length === 0 && <p className="text-slate-500 text-sm">No contacts yet.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAddContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <input
                placeholder="Name"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Role (e.g. Operations Manager)"
                value={contactForm.role_label}
                onChange={(e) => setContactForm({ ...contactForm, role_label: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
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
                  onClick={() => setShowAddContact(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddVacancy && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingVacancy ? 'Edit Vacancy' : 'Add Vacancy'}</h2>
            <form onSubmit={handleSaveVacancy} className="space-y-3">
              <input
                placeholder="Job title"
                required
                value={vacancyForm.title}
                onChange={(e) => setVacancyForm({ ...vacancyForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Location"
                value={vacancyForm.location}
                onChange={(e) => setVacancyForm({ ...vacancyForm, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Salary"
                value={vacancyForm.salary}
                onChange={(e) => setVacancyForm({ ...vacancyForm, salary: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={vacancyForm.description}
                onChange={(e) => setVacancyForm({ ...vacancyForm, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <select
                value={vacancyForm.status}
                onChange={(e) => setVacancyForm({ ...vacancyForm, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="open">Open</option>
                <option value="on_hold">On Hold</option>
                <option value="closed">Closed</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddVacancy(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {schedulingAssignment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-1">Schedule Interview</h2>
            <p className="text-sm text-slate-500 mb-4">
              {[schedulingAssignment.candidates?.first_name, schedulingAssignment.candidates?.last_name]
                .filter(Boolean)
                .join(' ')}
            </p>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date &amp; time</label>
            <input
              type="datetime-local"
              value={scheduleForm.datetime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, datetime: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            />

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Interview type</label>
            <div className="flex gap-2 mt-1 mb-3">
              <button
                type="button"
                onClick={() => setScheduleForm({ ...scheduleForm, type: 'teams' })}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg border-2 ${scheduleForm.type === 'teams' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
              >
                Microsoft Teams
              </button>
              <button
                type="button"
                onClick={() => setScheduleForm({ ...scheduleForm, type: 'in_person' })}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg border-2 ${scheduleForm.type === 'in_person' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
              >
                In Person
              </button>
            </div>

            {scheduleForm.type === 'in_person' ? (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Address</label>
                <input
                  placeholder="Where the candidate needs to go"
                  value={scheduleForm.address}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Meeting link (optional)
                </label>
                <input
                  placeholder="Paste a Teams link if you have one already"
                  value={scheduleForm.link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, link: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1"
                />
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3">
              The candidate will automatically be emailed these details.
            </p>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSendInterviewInvite}
                disabled={sendingInvite}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {sendingInvite ? 'Sending…' : 'Send Invite'}
              </button>
              <button
                onClick={() => setSchedulingAssignment(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {recordingFeeFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Record Placement Fee</h2>
            <p className="text-sm text-slate-500 mb-4">
              {[recordingFeeFor.candidates?.first_name, recordingFeeFor.candidates?.last_name]
                .filter(Boolean)
                .join(' ')}
            </p>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fee amount (£)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={feeForm.amount}
              onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            />

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
            <select
              value={feeForm.status}
              onChange={(e) => setFeeForm({ ...feeForm, status: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="invoiced">Invoiced</option>
              <option value="paid">Paid</option>
            </select>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveFee}
                disabled={savingFee}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {savingFee ? 'Saving…' : 'Save & Mark Placed'}
              </button>
              <button
                onClick={() => setRecordingFeeFor(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingNotesForAssignment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">
                Notes —{' '}
                {[viewingNotesForAssignment.candidates?.first_name, viewingNotesForAssignment.candidates?.last_name]
                  .filter(Boolean)
                  .join(' ')}
              </h2>
              <button
                onClick={() => setViewingNotesForAssignment(null)}
                className="text-2xl text-slate-400 leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Notes here are specific to this vacancy/interview.</p>

            <div className="mt-3">
              <textarea
                placeholder="e.g. Client feedback: strong technical answers, slightly light on leadership experience…"
                value={newAssignmentNote}
                onChange={(e) => setNewAssignmentNote(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddAssignmentNote}
                disabled={savingAssignmentNote || !newAssignmentNote.trim()}
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {savingAssignmentNote ? 'Adding…' : 'Add Note'}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {loadingAssignmentNotes ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : assignmentNotes.length === 0 ? (
                <p className="text-sm text-slate-400">No notes yet.</p>
              ) : (
                assignmentNotes.map((note) => (
                  <div key={note.id} className="border-l-2 border-orange-300 pl-3">
                    <p className="text-sm text-slate-700">{note.note_text}</p>
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

      {showCreateInvoice && viewingClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">Create Invoice</h2>
            <p className="text-sm text-slate-500 mb-4">{viewingClient.company_name}</p>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Billing email</label>
            <input
              placeholder="accounts@client.com"
              value={invoiceBillingEmail}
              onChange={(e) => setInvoiceBillingEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 mb-4"
            />

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Select placements to invoice
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {assignments
                .filter((a) => a.stage === 'placed' && a.fee_status === 'pending')
                .map((a) => {
                  const vacancy = vacancies.find((v) => v.id === a.vacancy_id)
                  return (
                    <label
                      key={a.id}
                      className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg p-2.5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedForInvoice.has(a.id)}
                          onChange={() => toggleInvoiceSelection(a.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {[a.candidates?.first_name, a.candidates?.last_name].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs text-slate-400">{vacancy?.title}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        £{Number(a.fee_amount || 0).toFixed(2)}
                      </p>
                    </label>
                  )
                })}
              {assignments.filter((a) => a.stage === 'placed' && a.fee_status === 'pending').length === 0 && (
                <p className="text-sm text-slate-400">
                  No unbilled placements for this client — mark a candidate as Placed with a fee first.
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice || selectedForInvoice.size === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {generatingInvoice ? 'Generating…' : 'Generate & Send'}
              </button>
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {snoozingAssignment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Snooze Reminder</h2>
            <p className="text-sm text-slate-500 mb-4">
              {[snoozingAssignment.candidates?.first_name, snoozingAssignment.candidates?.last_name]
                .filter(Boolean)
                .join(' ')}
            </p>

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Remind me on</label>
            <input
              type="date"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 mb-3"
            />

            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Note (optional)</label>
            <input
              placeholder="e.g. call back after their holiday"
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
                onClick={() => setSnoozingAssignment(null)}
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