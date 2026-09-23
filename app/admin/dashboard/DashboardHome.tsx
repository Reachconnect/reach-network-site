'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UpcomingInterview = {
  id: string
  candidateName: string
  vacancyTitle: string
  clientName: string
  interviewDatetime: string
}

type AwaitingFeedback = {
  id: string
  candidateName: string
  vacancyTitle: string
  clientName: string
  daysWaiting: number
}

type OverdueInvoice = {
  id: string
  invoiceNumber: string
  clientName: string
  totalAmount: number
  dueDate: string
}

type LeadToCall = {
  id: string
  companyName: string
  contactName: string | null
  callDate: string
}

export default function DashboardHome({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    liveVacancies: 0,
    totalCandidates: 0,
    totalClients: 0,
    activeLeads: 0,
    pendingInvoiceCount: 0,
    pendingInvoiceTotal: 0,
  })
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([])
  const [awaitingFeedback, setAwaitingFeedback] = useState<AwaitingFeedback[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<OverdueInvoice[]>([])
  const [leadsToCall, setLeadsToCall] = useState<LeadToCall[]>([])

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString()

    const [
      vacanciesResult,
      candidatesResult,
      clientsResult,
      invoicesResult,
      interviewAssignmentsResult,
      feedbackAssignmentsResult,
      leadsResult,
      activeLeadsCountResult,
    ] = await Promise.all([
      supabase.from('vacancies').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('candidates').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, due_date, status, clients(company_name)')
        .neq('status', 'paid'),
      supabase
        .from('vacancy_assignments')
        .select('id, interview_datetime, candidates(first_name, last_name), vacancies(title, clients(company_name))')
        .eq('stage', 'interview')
        .gte('interview_datetime', new Date().toISOString())
        .lte('interview_datetime', weekAhead)
        .order('interview_datetime', { ascending: true }),
      supabase
        .from('vacancy_assignments')
        .select('id, stage_updated_at, candidates(first_name, last_name), vacancies(title, clients(company_name))')
        .eq('stage', 'cv_sent')
        .order('stage_updated_at', { ascending: true }),
      supabase
        .from('leads')
        .select('id, company_name, contact_name, next_call_at')
        .not('next_call_at', 'is', null)
        .lte('next_call_at', weekAhead)
        .order('next_call_at', { ascending: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('stage', 'in', '(converted,lost)'),
    ])

    const pendingInvoices = invoicesResult.data || []
    const pendingInvoiceTotal = pendingInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

    setStats({
      liveVacancies: vacanciesResult.count || 0,
      totalCandidates: candidatesResult.count || 0,
      totalClients: clientsResult.count || 0,
      activeLeads: activeLeadsCountResult.count || 0,
      pendingInvoiceCount: pendingInvoices.length,
      pendingInvoiceTotal,
    })

    setOverdueInvoices(
      pendingInvoices
        .filter((inv: any) => inv.due_date && inv.due_date < today)
        .map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          clientName: inv.clients?.company_name || 'Unknown client',
          totalAmount: Number(inv.total_amount || 0),
          dueDate: inv.due_date,
        }))
    )

    setUpcomingInterviews(
      (interviewAssignmentsResult.data || []).map((a: any) => ({
        id: a.id,
        candidateName: [a.candidates?.first_name, a.candidates?.last_name].filter(Boolean).join(' ') || 'Unknown',
        vacancyTitle: a.vacancies?.title || 'Unknown role',
        clientName: a.vacancies?.clients?.company_name || 'Unknown client',
        interviewDatetime: a.interview_datetime,
      }))
    )

    setAwaitingFeedback(
      (feedbackAssignmentsResult.data || [])
        .map((a: any) => ({
          id: a.id,
          candidateName: [a.candidates?.first_name, a.candidates?.last_name].filter(Boolean).join(' ') || 'Unknown',
          vacancyTitle: a.vacancies?.title || 'Unknown role',
          clientName: a.vacancies?.clients?.company_name || 'Unknown client',
          daysWaiting: a.stage_updated_at
            ? Math.floor((Date.now() - new Date(a.stage_updated_at).getTime()) / 86400000)
            : 0,
        }))
        .sort((a, b) => b.daysWaiting - a.daysWaiting)
        .slice(0, 8)
    )

    setLeadsToCall(
      (leadsResult.data || []).map((lead: any) => ({
        id: lead.id,
        companyName: lead.company_name,
        contactName: lead.contact_name,
        callDate: lead.next_call_at,
      }))
    )

    setLoading(false)
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-500 mb-6">What needs your attention today.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => onNavigate('leads')}
          className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-orange-300 transition"
        >
          <p className="text-3xl font-bold text-slate-900">{stats.activeLeads}</p>
          <p className="text-sm text-slate-500 mt-1">Active Leads</p>
        </button>
        <button
          onClick={() => onNavigate('clients')}
          className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-orange-300 transition"
        >
          <p className="text-3xl font-bold text-slate-900">{stats.liveVacancies}</p>
          <p className="text-sm text-slate-500 mt-1">Live Vacancies</p>
        </button>
        <button
          onClick={() => onNavigate('candidates')}
          className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-orange-300 transition"
        >
          <p className="text-3xl font-bold text-slate-900">{stats.totalCandidates}</p>
          <p className="text-sm text-slate-500 mt-1">Candidates</p>
        </button>
        <button
          onClick={() => onNavigate('clients')}
          className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-orange-300 transition"
        >
          <p className="text-3xl font-bold text-slate-900">{stats.totalClients}</p>
          <p className="text-sm text-slate-500 mt-1">Clients</p>
        </button>
        <button
          onClick={() => onNavigate('clients')}
          className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-orange-300 transition"
        >
          <p className="text-3xl font-bold text-slate-900">£{stats.pendingInvoiceTotal.toFixed(0)}</p>
          <p className="text-sm text-slate-500 mt-1">
            Outstanding ({stats.pendingInvoiceCount} invoice{stats.pendingInvoiceCount === 1 ? '' : 's'})
          </p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Leads to Call</h2>
          <div className="space-y-3">
            {leadsToCall.map((lead) => (
              <button
                key={lead.id}
                onClick={() => onNavigate('leads')}
                className="w-full text-left border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-slate-800">{lead.companyName}</p>
                {lead.contactName && <p className="text-xs text-slate-500">{lead.contactName}</p>}
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  {new Date(lead.callDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))}
            {leadsToCall.length === 0 && <p className="text-sm text-slate-400">No calls due this week.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Interviews This Week</h2>
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <button
                key={interview.id}
                onClick={() => onNavigate('clients')}
                className="w-full text-left border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-slate-800">{interview.candidateName}</p>
                <p className="text-xs text-slate-500">
                  {interview.vacancyTitle} · {interview.clientName}
                </p>
                <p className="text-xs font-semibold text-orange-600 mt-0.5">
                  {new Date(interview.interviewDatetime).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))}
            {upcomingInterviews.length === 0 && (
              <p className="text-sm text-slate-400">No interviews scheduled this week.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Awaiting Client Feedback</h2>
          <div className="space-y-3">
            {awaitingFeedback.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate('clients')}
                className="w-full text-left border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-slate-800">{item.candidateName}</p>
                <p className="text-xs text-slate-500">
                  {item.vacancyTitle} · {item.clientName}
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${item.daysWaiting >= 5 ? 'text-red-600' : 'text-slate-400'}`}>
                  Waiting {item.daysWaiting} day{item.daysWaiting === 1 ? '' : 's'}
                </p>
              </button>
            ))}
            {awaitingFeedback.length === 0 && (
              <p className="text-sm text-slate-400">Nothing awaiting feedback right now.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-bold text-slate-800 mb-3">Overdue Invoices</h2>
          <div className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <button
                key={invoice.id}
                onClick={() => onNavigate('clients')}
                className="w-full text-left border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-slate-800">{invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-500">{invoice.clientName}</p>
                <p className="text-xs font-semibold text-red-600 mt-0.5">
                  £{invoice.totalAmount.toFixed(2)} · was due{' '}
                  {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))}
            {overdueInvoices.length === 0 && <p className="text-sm text-slate-400">No overdue invoices.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}