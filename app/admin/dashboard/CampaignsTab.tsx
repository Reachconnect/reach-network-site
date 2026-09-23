'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CampaignEditor, { Block, compileBlocksToHtml } from './CampaignEditor'

type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  company: string | null
  unsubscribed: boolean
  bounced: boolean
  tags: string[]
  created_at: string
}

type Campaign = {
  id: string
  name: string
  subject: string
  from_name: string
  from_email: string
  reply_to: string | null
  body_html: string
  blocks_json: Block[] | null
  status: string
  scheduled_at: string | null
  sent_at: string | null
  target_tag: string | null
  created_at: string
}

type SendStats = { totalSent: number; opened: number; clicked: number; pending: number; failed: number }

type RecipientRow = {
  sendId: string
  contactId: string
  firstName: string | null
  lastName: string | null
  email: string
  company: string | null
  openedAt: string | null
  openCount: number
  clickedAt: string | null
  clickCount: number
}

type ParsedContact = { email: string; first_name: string | null; last_name: string | null; company: string | null }

function defaultBlocks(): Block[] {
  return [
    { id: crypto.randomUUID(), type: 'heading', text: 'Hi {{first_name}},' },
    { id: crypto.randomUUID(), type: 'paragraph', text: 'Write your message here.' },
    { id: crypto.randomUUID(), type: 'button', text: 'Book a call', link: 'https://www.reachnetworkrec.com/book-a-call' },
  ]
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\r') {
      // skip
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.length > 0 && !(r.length === 1 && r[0].trim() === ''))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const HEADER_VARIANTS: Record<string, string[]> = {
  email: ['email', 'e-mail', 'email address', 'emailaddress'],
  first_name: ['first name', 'firstname', 'first', 'given name'],
  last_name: ['last name', 'lastname', 'surname', 'family name', 'last'],
  company: ['company', 'organisation', 'organization', 'business'],
}

function detectHeaderMapping(headerRow: string[]) {
  const normalized = headerRow.map((h) => h.trim().toLowerCase())
  const mapping: Record<string, number> = {}
  for (const [field, variants] of Object.entries(HEADER_VARIANTS)) {
    const idx = normalized.findIndex((h) => variants.includes(h))
    if (idx !== -1) mapping[field] = idx
  }
  return mapping
}

function rowsToContacts(rows: string[][]): { contacts: ParsedContact[]; invalidCount: number } {
  if (rows.length === 0) return { contacts: [], invalidCount: 0 }

  const firstRowLooksLikeHeader = !rows[0].some((cell) => EMAIL_PATTERN.test(cell.trim()))
  const mapping = firstRowLooksLikeHeader ? detectHeaderMapping(rows[0]) : {}
  const dataRows = firstRowLooksLikeHeader ? rows.slice(1) : rows
  const hasMapping = Object.keys(mapping).length > 0

  const contacts: ParsedContact[] = []
  let invalidCount = 0

  for (const row of dataRows) {
    let email = ''
    let first_name: string | null = null
    let last_name: string | null = null
    let company: string | null = null

    if (hasMapping && mapping.email !== undefined) {
      email = (row[mapping.email] || '').trim()
      first_name = mapping.first_name !== undefined ? (row[mapping.first_name] || '').trim() || null : null
      last_name = mapping.last_name !== undefined ? (row[mapping.last_name] || '').trim() || null : null
      company = mapping.company !== undefined ? (row[mapping.company] || '').trim() || null : null
    } else {
      const emailIdx = row.findIndex((cell) => EMAIL_PATTERN.test(cell.trim()))
      if (emailIdx === -1) {
        invalidCount++
        continue
      }
      email = row[emailIdx].trim()
      const rest = row.filter((_, i) => i !== emailIdx).map((c) => c.trim()).filter(Boolean)
      first_name = rest[0] || null
      last_name = rest[1] || null
      company = rest[2] || null
    }

    if (!EMAIL_PATTERN.test(email)) {
      invalidCount++
      continue
    }

    contacts.push({ email: email.toLowerCase(), first_name, last_name, company })
  }

  const seen = new Set<string>()
  const deduped = contacts.filter((c) => {
    if (seen.has(c.email)) return false
    seen.add(c.email)
    return true
  })

  return { contacts: deduped, invalidCount }
}

function formatDateTime(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CampaignsTab() {
  const [subTab, setSubTab] = useState<'campaigns' | 'contacts'>('campaigns')

  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [statsByCampaign, setStatsByCampaign] = useState<Record<string, SendStats>>({})
  const [loading, setLoading] = useState(true)

  const [showContactForm, setShowContactForm] = useState(false)
  const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', company: '', tags: '' })

  const [showImport, setShowImport] = useState(false)
  const [importMethod, setImportMethod] = useState<'csv' | 'paste'>('csv')
  const [pasteText, setPasteText] = useState('')
  const [importTag, setImportTag] = useState('')
  const [previewContacts, setPreviewContacts] = useState<ParsedContact[] | null>(null)
  const [invalidRowCount, setInvalidRowCount] = useState(0)
  const [importing, setImporting] = useState(false)
  const [importProgressMsg, setImportProgressMsg] = useState<string | null>(null)

  const [showCampaignEditor, setShowCampaignEditor] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [campaignMeta, setCampaignMeta] = useState({
    name: '',
    subject: '',
    from_name: 'Reach Network Recruitment',
    from_email: 'hello@reachnetworkrec.com',
    reply_to: '',
    target_tag: '',
  })
  const [editorBlocks, setEditorBlocks] = useState<Block[]>(defaultBlocks())
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null)
  const [sendResultMsg, setSendResultMsg] = useState<string | null>(null)

  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null)

  const [schedulingCampaign, setSchedulingCampaign] = useState<Campaign | null>(null)
  const [scheduleDateTime, setScheduleDateTime] = useState('')

  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null)
  const [recipientRows, setRecipientRows] = useState<RecipientRow[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipientPage, setRecipientPage] = useState(0)
  const [hasMoreRecipients, setHasMoreRecipients] = useState(true)
  const RECIPIENT_PAGE_SIZE = 200

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()

    const [contactsResult, campaignsResult, sendsResult] = await Promise.all([
      supabase.from('email_contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('email_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('email_sends').select('campaign_id, status, opened_at, clicked_at'),
    ])

    setContacts(contactsResult.data || [])
    setCampaigns(campaignsResult.data || [])

    const stats: Record<string, SendStats> = {}
    for (const send of sendsResult.data || []) {
      if (!stats[send.campaign_id]) {
        stats[send.campaign_id] = { totalSent: 0, opened: 0, clicked: 0, pending: 0, failed: 0 }
      }
      const s = stats[send.campaign_id]
      if (send.status === 'sent') s.totalSent++
      if (send.status === 'pending') s.pending++
      if (send.status === 'failed') s.failed++
      if (send.opened_at) s.opened++
      if (send.clicked_at) s.clicked++
    }
    setStatsByCampaign(stats)

    setLoading(false)
  }

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || []))).sort()

  function matchingAudienceCount(tag: string) {
    return contacts.filter((c) => !c.unsubscribed && !c.bounced && (!tag || (c.tags || []).includes(tag))).length
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const tags = contactForm.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const { data, error } = await supabase
      .from('email_contacts')
      .insert({
        first_name: contactForm.first_name || null,
        last_name: contactForm.last_name || null,
        email: contactForm.email,
        company: contactForm.company || null,
        tags,
      })
      .select()
      .single()

    if (!error && data) {
      setContacts([data, ...contacts])
      setContactForm({ first_name: '', last_name: '', email: '', company: '', tags: '' })
      setShowContactForm(false)
    } else if (error) {
      alert(error.message)
    }
  }

  function handleCsvFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      const { contacts: parsed, invalidCount } = rowsToContacts(rows)
      setPreviewContacts(parsed)
      setInvalidRowCount(invalidCount)
    }
    reader.readAsText(file)
  }

  function handlePreviewPaste() {
    const rows = parseCSV(pasteText)
    const { contacts: parsed, invalidCount } = rowsToContacts(rows)
    setPreviewContacts(parsed)
    setInvalidRowCount(invalidCount)
  }

  async function handleConfirmImport() {
    if (!previewContacts || previewContacts.length === 0) return

    setImporting(true)
    const supabase = createClient()
    const chunkSize = 500
    const tags = importTag.trim() ? [importTag.trim()] : []

    const withTags = previewContacts.map((c) => ({ ...c, tags }))

    for (let i = 0; i < withTags.length; i += chunkSize) {
      const chunk = withTags.slice(i, i + chunkSize)
      const { error } = await supabase
        .from('email_contacts')
        .upsert(chunk, { onConflict: 'email', ignoreDuplicates: true })

      if (error) {
        setImportProgressMsg('Error partway through: ' + error.message)
        setImporting(false)
        return
      }

      setImportProgressMsg(`Imported ${Math.min(i + chunkSize, withTags.length)} of ${withTags.length}…`)
    }

    setImportProgressMsg(`Done — imported ${withTags.length} contacts.`)
    setImporting(false)
    setPreviewContacts(null)
    setPasteText('')
    setImportTag('')
    await loadData()
  }

  function closeImportModal() {
    setShowImport(false)
    setPreviewContacts(null)
    setInvalidRowCount(0)
    setPasteText('')
    setImportTag('')
    setImportProgressMsg(null)
  }

  async function handleDeleteContact(id: string) {
    if (!confirm('Remove this contact?')) return
    const supabase = createClient()
    const { error } = await supabase.from('email_contacts').delete().eq('id', id)
    if (!error) setContacts(contacts.filter((c) => c.id !== id))
  }

  async function handleToggleUnsubscribed(contact: Contact) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('email_contacts')
      .update({ unsubscribed: !contact.unsubscribed })
      .eq('id', contact.id)
      .select()
      .single()
    if (!error && data) setContacts(contacts.map((c) => (c.id === contact.id ? data : c)))
  }

  function openNewCampaign() {
    setEditingCampaignId(null)
    setCampaignMeta({
      name: '',
      subject: '',
      from_name: 'Reach Network Recruitment',
      from_email: 'hello@reachnetworkrec.com',
      reply_to: '',
      target_tag: '',
    })
    setEditorBlocks(defaultBlocks())
    setTestResultMsg(null)
    setShowCampaignEditor(true)
  }

  function openEditCampaign(campaign: Campaign) {
    setEditingCampaignId(campaign.id)
    setCampaignMeta({
      name: campaign.name,
      subject: campaign.subject,
      from_name: campaign.from_name,
      from_email: campaign.from_email,
      reply_to: campaign.reply_to || '',
      target_tag: campaign.target_tag || '',
    })
    setEditorBlocks(campaign.blocks_json && campaign.blocks_json.length > 0 ? campaign.blocks_json : defaultBlocks())
    setTestResultMsg(null)
    setShowCampaignEditor(true)
  }

  async function handleSaveCampaign() {
    if (!campaignMeta.name.trim() || !campaignMeta.subject.trim()) {
      alert('Please fill in the campaign name and subject line.')
      return
    }

    setSavingCampaign(true)
    const supabase = createClient()
    const body_html = compileBlocksToHtml(editorBlocks)
    const payload = {
      ...campaignMeta,
      reply_to: campaignMeta.reply_to || null,
      target_tag: campaignMeta.target_tag || null,
      body_html,
      blocks_json: editorBlocks,
    }

    if (editingCampaignId) {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(payload)
        .eq('id', editingCampaignId)
        .select()
        .single()
      setSavingCampaign(false)
      if (!error && data) {
        setCampaigns(campaigns.map((c) => (c.id === editingCampaignId ? data : c)))
        setShowCampaignEditor(false)
      } else if (error) {
        alert(error.message)
      }
    } else {
      const { data, error } = await supabase.from('email_campaigns').insert(payload).select().single()
      setSavingCampaign(false)
      if (!error && data) {
        setCampaigns([data, ...campaigns])
        setShowCampaignEditor(false)
      } else if (error) {
        alert(error.message)
      }
    }
  }

  async function handleSendTest() {
    if (!testEmailAddress.trim()) {
      setTestResultMsg('Enter an email address first.')
      return
    }

    setSendingTest(true)
    setTestResultMsg(null)

    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmailAddress.trim(),
          subject: campaignMeta.subject,
          bodyHtml: compileBlocksToHtml(editorBlocks),
          fromName: campaignMeta.from_name,
          fromEmail: campaignMeta.from_email,
          replyTo: campaignMeta.reply_to,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Send failed')
      setTestResultMsg(`Test sent to ${testEmailAddress}.`)
    } catch (err: any) {
      setTestResultMsg('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSendingTest(false)
    }
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm('Delete this campaign? This does not un-send emails already sent.')) return
    const supabase = createClient()
    // Cancel any queued-but-not-yet-sent emails first, so nothing
    // slips out after the campaign itself is gone
    await supabase.from('email_sends').update({ status: 'cancelled' }).eq('campaign_id', id).eq('status', 'pending')
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
    if (!error) setCampaigns(campaigns.filter((c) => c.id !== id))
  }

  async function handleStopSending(campaign: Campaign) {
    if (
      !confirm(
        `Stop "${campaign.name}"? Anyone who hasn't been emailed yet will be skipped. Emails already sent can't be recalled.`
      )
    )
      return

    const supabase = createClient()
    await supabase
      .from('email_sends')
      .update({ status: 'cancelled' })
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')

    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ status: 'cancelled' })
      .eq('id', campaign.id)
      .select()
      .single()

    if (!error && data) {
      setCampaigns(campaigns.map((c) => (c.id === campaign.id ? data : c)))
    } else if (error) {
      alert(error.message)
    }
  }

  async function handleSendCampaign(campaign: Campaign) {
    const audienceCount = matchingAudienceCount(campaign.target_tag || '')
    const confirmed = confirm(
      `Queue "${campaign.name}" to send to ${audienceCount} contact${audienceCount === 1 ? '' : 's'} now?\n\nEmails go out gradually over time, not all at once — this protects deliverability. This cannot be undone.`
    )
    if (!confirmed) return

    setSendingCampaignId(campaign.id)
    setSendResultMsg(null)

    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Send failed')

      setSendResultMsg(`Queued ${result.totalContacts} emails — they'll go out gradually over the next while.`)
      await loadData()
    } catch (err: any) {
      setSendResultMsg('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSendingCampaignId(null)
    }
  }

  function openScheduleModal(campaign: Campaign) {
    setSchedulingCampaign(campaign)
    setScheduleDateTime('')
  }

  async function handleConfirmSchedule() {
    if (!schedulingCampaign || !scheduleDateTime) return

    const scheduledAt = new Date(scheduleDateTime).toISOString()

    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: schedulingCampaign.id, scheduledAt }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Schedule failed')

      setSchedulingCampaign(null)
      await loadData()
    } catch (err: any) {
      alert('Error: ' + (err?.message || 'unknown error'))
    }
  }

  async function handleCancelSchedule(campaign: Campaign) {
    if (!confirm('Cancel this scheduled send and return it to draft?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('email_campaigns')
      .update({ status: 'draft', scheduled_at: null })
      .eq('id', campaign.id)
    if (!error) await loadData()
  }

  async function openRecipientsView(campaign: Campaign) {
    setViewingCampaign(campaign)
    setRecipientRows([])
    setRecipientSearch('')
    setRecipientPage(0)
    setHasMoreRecipients(true)
    await loadRecipientPage(campaign.id, 0, true)
  }

  async function loadRecipientPage(campaignId: string, page: number, replace: boolean) {
    setLoadingRecipients(true)
    const supabase = createClient()
    const from = page * RECIPIENT_PAGE_SIZE
    const to = from + RECIPIENT_PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('email_sends')
      .select('id, contact_id, opened_at, open_count, clicked_at, click_count, email_contacts(first_name, last_name, email, company)')
      .eq('campaign_id', campaignId)
      .order('clicked_at', { ascending: false, nullsFirst: false })
      .order('opened_at', { ascending: false, nullsFirst: false })
      .range(from, to)

    setLoadingRecipients(false)

    if (error) {
      console.error('Load recipients error:', error)
      return
    }

    const rows: RecipientRow[] = (data || []).map((send: any) => ({
      sendId: send.id,
      contactId: send.contact_id,
      firstName: send.email_contacts?.first_name ?? null,
      lastName: send.email_contacts?.last_name ?? null,
      email: send.email_contacts?.email ?? '(unknown)',
      company: send.email_contacts?.company ?? null,
      openedAt: send.opened_at,
      openCount: send.open_count || 0,
      clickedAt: send.clicked_at,
      clickCount: send.click_count || 0,
    }))

    setRecipientRows(replace ? rows : (prev) => [...prev, ...rows])
    setHasMoreRecipients(rows.length === RECIPIENT_PAGE_SIZE)
  }

  function loadMoreRecipients() {
    if (!viewingCampaign) return
    const nextPage = recipientPage + 1
    setRecipientPage(nextPage)
    loadRecipientPage(viewingCampaign.id, nextPage, false)
  }

  const activeContactCount = contacts.filter((c) => !c.unsubscribed && !c.bounced).length

  if (loading) return <p className="text-slate-500">Loading…</p>

  function statusBadge(campaign: Campaign) {
    const styles: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-500',
      scheduled: 'bg-purple-100 text-purple-700',
      sending: 'bg-orange-100 text-orange-700',
      sent: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-600',
    }
    const labels: Record<string, string> = {
      draft: 'draft',
      scheduled: `scheduled for ${formatDateTime(campaign.scheduled_at)}`,
      sending: 'sending…',
      sent: 'sent',
      cancelled: 'stopped',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[campaign.status] || styles.draft}`}>
        {labels[campaign.status] || campaign.status}
      </span>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSubTab('campaigns')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab === 'campaigns' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setSubTab('contacts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${subTab === 'contacts' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Contacts ({activeContactCount} active)
        </button>
      </div>

      {subTab === 'campaigns' && (
        <div>
          <button
            onClick={openNewCampaign}
            className="mb-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Campaign
          </button>

          {sendResultMsg && (
            <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
              {sendResultMsg}
            </div>
          )}

          <div className="space-y-3">
            {campaigns.map((campaign) => {
              const stats = statsByCampaign[campaign.id] || {
                totalSent: 0,
                opened: 0,
                clicked: 0,
                pending: 0,
                failed: 0,
              }
              const totalQueued = stats.totalSent + stats.pending + stats.failed
              const openRate = stats.totalSent > 0 ? Math.round((stats.opened / stats.totalSent) * 100) : 0
              const clickRate = stats.totalSent > 0 ? Math.round((stats.clicked / stats.totalSent) * 100) : 0

              return (
                <div key={campaign.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                        {statusBadge(campaign)}
                        {campaign.target_tag && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                            #{campaign.target_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{campaign.subject}</p>
                    </div>

                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      {campaign.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEditCampaign(campaign)}
                            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openScheduleModal(campaign)}
                            className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => handleSendCampaign(campaign)}
                            disabled={sendingCampaignId === campaign.id || activeContactCount === 0}
                            className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            {sendingCampaignId === campaign.id ? 'Queuing…' : 'Send Now'}
                          </button>
                        </>
                      )}
                      {campaign.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelSchedule(campaign)}
                          className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                        >
                          Cancel schedule
                        </button>
                      )}
                      {campaign.status === 'sending' && (
                        <button
                          onClick={() => handleStopSending(campaign)}
                          className="text-sm bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Stop Sending
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCampaign(campaign.id)}
                        className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {(campaign.status === 'sending' || campaign.status === 'sent' || campaign.status === 'cancelled') && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-slate-400">Sent</p>
                          <p className="text-lg font-bold text-slate-800">
                            {stats.totalSent}
                            {totalQueued > 0 && campaign.status === 'sending' && (
                              <span className="text-xs font-normal text-slate-400"> / {totalQueued}</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Opened</p>
                          <p className="text-lg font-bold text-slate-800">
                            {stats.opened} <span className="text-xs font-normal text-slate-400">({openRate}%)</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Clicked</p>
                          <p className="text-lg font-bold text-slate-800">
                            {stats.clicked} <span className="text-xs font-normal text-slate-400">({clickRate}%)</span>
                          </p>
                        </div>
                        {stats.failed > 0 && (
                          <div>
                            <p className="text-xs text-red-400">Failed</p>
                            <p className="text-lg font-bold text-red-600">{stats.failed}</p>
                          </div>
                        )}
                      </div>
                      {campaign.status === 'sending' && (
                        <p className="text-xs text-slate-400 mt-2">
                          Sending gradually in the background — refresh this page to see progress.
                        </p>
                      )}
                      <button
                        onClick={() => openRecipientsView(campaign)}
                        className="mt-3 text-sm font-bold text-orange-600 hover:text-orange-700"
                      >
                        View who opened &amp; clicked →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {campaigns.length === 0 && <p className="text-slate-500">No campaigns yet.</p>}
          </div>
        </div>
      )}

      {subTab === 'contacts' && (
        <div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowContactForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Add Contact
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              Import Contacts
            </button>
          </div>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email}
                    </p>
                    {contact.unsubscribed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        Unsubscribed
                      </span>
                    )}
                    {contact.bounced && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Bounced</span>
                    )}
                    {(contact.tags || []).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    {contact.email} {contact.company && `· ${contact.company}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleUnsubscribed(contact)}
                    className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1"
                  >
                    {contact.unsubscribed ? 'Re-subscribe' : 'Unsubscribe'}
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-slate-500">No contacts yet.</p>}
          </div>
        </div>
      )}

      {showContactForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="First name"
                  value={contactForm.first_name}
                  onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
                <input
                  placeholder="Last name"
                  value={contactForm.last_name}
                  onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Company"
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Tags, comma separated (e.g. warehouse, apollo)"
                value={contactForm.tags}
                onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })}
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
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Import Contacts</h2>

            {!previewContacts && (
              <>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setImportMethod('csv')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${importMethod === 'csv' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Upload CSV
                  </button>
                  <button
                    onClick={() => setImportMethod('paste')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${importMethod === 'paste' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Paste text
                  </button>
                </div>

                <input
                  placeholder="Tag this whole list (optional, e.g. apollo-warehouse-leads)"
                  value={importTag}
                  onChange={(e) => setImportTag(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
                />

                {importMethod === 'csv' ? (
                  <div>
                    <p className="text-sm text-slate-500 mb-3">
                      Upload a CSV exported from a spreadsheet. Column headers like "Email", "First Name", "Last
                      Name", "Company" are detected automatically — order doesn't matter.
                    </p>
                    <label className="block border-2 border-dashed border-slate-300 rounded-xl px-6 py-10 text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
                      <p className="font-semibold text-slate-700">Click to choose a CSV file</p>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleCsvFile(file)
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-500 mb-3">
                      One contact per line — email, first name, and last name in any order, comma or space
                      separated.
                    </p>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={8}
                      placeholder="john@company.com, John, Smith"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={handlePreviewPaste}
                      disabled={!pasteText.trim()}
                      className="mt-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      Preview
                    </button>
                  </div>
                )}
              </>
            )}

            {previewContacts && (
              <div>
                <div className="flex gap-4 mb-3">
                  <div className="bg-green-50 rounded-lg px-4 py-2">
                    <p className="text-2xl font-bold text-green-700">{previewContacts.length}</p>
                    <p className="text-xs text-green-700 font-semibold">Ready to import</p>
                  </div>
                  {invalidRowCount > 0 && (
                    <div className="bg-red-50 rounded-lg px-4 py-2">
                      <p className="text-2xl font-bold text-red-600">{invalidRowCount}</p>
                      <p className="text-xs text-red-600 font-semibold">Skipped (no valid email)</p>
                    </div>
                  )}
                  {importTag && (
                    <div className="bg-indigo-50 rounded-lg px-4 py-2 flex items-center">
                      <p className="text-sm font-semibold text-indigo-700">Tag: #{importTag}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Preview (first 50 rows) — check this looks right before importing
                </p>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Email</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">First name</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Last name</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500">Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewContacts.slice(0, 50).map((c, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-1.5 text-slate-700">{c.email}</td>
                          <td className="px-3 py-1.5 text-slate-500">{c.first_name || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-500">{c.last_name || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-500">{c.company || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {importProgressMsg && (
                  <p className="mt-3 text-sm font-semibold text-slate-700">{importProgressMsg}</p>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
                  >
                    {importing ? 'Importing…' : `Confirm Import (${previewContacts.length})`}
                  </button>
                  <button
                    onClick={() => setPreviewContacts(null)}
                    disabled={importing}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button onClick={closeImportModal} className="text-sm text-slate-500 font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCampaignEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-7xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingCampaignId ? 'Edit Campaign' : 'New Campaign'}</h2>
              <button onClick={() => setShowCampaignEditor(false)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                placeholder="Campaign name (internal only)"
                value={campaignMeta.name}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, name: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Subject line (supports {{first_name}})"
                value={campaignMeta.subject}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, subject: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="From name"
                value={campaignMeta.from_name}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, from_name: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="From email"
                value={campaignMeta.from_email}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, from_email: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Reply-To (optional — defaults to From email)"
                value={campaignMeta.reply_to}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, reply_to: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={campaignMeta.target_tag}
                onChange={(e) => setCampaignMeta({ ...campaignMeta, target_tag: e.target.value })}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">All contacts ({matchingAudienceCount('')})</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag} ({matchingAudienceCount(tag)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 mb-5 bg-slate-50 rounded-lg p-3">
              <input
                type="email"
                placeholder="Send a test to your own email…"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {sendingTest ? 'Sending…' : 'Send Test'}
              </button>
              {testResultMsg && <span className="text-xs font-semibold text-slate-600">{testResultMsg}</span>}
            </div>

            <CampaignEditor initialBlocks={editorBlocks} onChange={setEditorBlocks} />

            <div className="flex gap-2 pt-5 border-t border-slate-100 mt-5">
              <button
                onClick={handleSaveCampaign}
                disabled={savingCampaign}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50"
              >
                {savingCampaign ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={() => setShowCampaignEditor(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {schedulingCampaign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-1">Schedule Send</h2>
            <p className="text-sm text-slate-500 mb-4">{schedulingCampaign.name}</p>
            <input
              type="datetime-local"
              value={scheduleDateTime}
              onChange={(e) => setScheduleDateTime(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleDateTime}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                Schedule
              </button>
              <button
                onClick={() => setSchedulingCampaign(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingCampaign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold">{viewingCampaign.name}</h2>
              <button onClick={() => setViewingCampaign(null)} className="text-2xl text-slate-400 leading-none">
                &times;
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Sorted by engagement — clicked first, then opened, then everyone else.
            </p>

            <input
              placeholder="Search by name or email…"
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">Contact</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">Opened</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-500">Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {recipientRows
                    .filter((r) => {
                      const term = recipientSearch.trim().toLowerCase()
                      if (!term) return true
                      const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase()
                      return name.includes(term) || r.email.toLowerCase().includes(term)
                    })
                    .map((r) => (
                      <tr key={r.sendId} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-slate-800">
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.email} {r.company && `· ${r.company}`}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          {r.openedAt ? (
                            <div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Opened{r.openCount > 1 ? ` ×${r.openCount}` : ''}
                              </span>
                              <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(r.openedAt)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {r.clickedAt ? (
                            <div>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Clicked{r.clickCount > 1 ? ` ×${r.clickCount}` : ''}
                              </span>
                              <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(r.clickedAt)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {loadingRecipients && <p className="text-sm text-slate-400 text-center py-4">Loading…</p>}

            {!loadingRecipients && hasMoreRecipients && (
              <button
                onClick={loadMoreRecipients}
                className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm"
              >
                Load more
              </button>
            )}

            {!loadingRecipients && recipientRows.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No recipients found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}