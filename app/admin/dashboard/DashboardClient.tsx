'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Job = {
  id: string
  title: string
  category: string
  location: string | null
  employment_type: string | null
  salary: string | null
  description: string | null
  status: string
  created_at: string
}

type Application = {
  id: string
  name: string
  email: string
  phone: string | null
  cv_url: string | null
  created_at: string
  jobs: { title: string } | null
}

export default function DashboardClient({
  initialJobs,
  initialApplications,
}: {
  initialJobs: Job[]
  initialApplications: Application[]
}) {
  const [jobs, setJobs] = useState(initialJobs)
  const [applications, setApplications] = useState(initialApplications)
  const [tab, setTab] = useState<'jobs' | 'applications'>('jobs')
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    category: '',
    location: '',
    employment_type: 'Temporary',
    salary: '',
    description: '',
    status: 'open',
  })

  function openNewForm() {
    setEditingJob(null)
    setForm({
      title: '',
      category: '',
      location: '',
      employment_type: 'Temporary',
      salary: '',
      description: '',
      status: 'open',
    })
    setShowForm(true)
  }

  function openEditForm(job: Job) {
    setEditingJob(job)
    setForm({
      title: job.title,
      category: job.category,
      location: job.location || '',
      employment_type: job.employment_type || 'Temporary',
      salary: job.salary || '',
      description: job.description || '',
      status: job.status,
    })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()

    if (editingJob) {
      const { data, error } = await supabase
        .from('jobs')
        .update(form)
        .eq('id', editingJob.id)
        .select()
        .single()

      if (!error && data) {
        setJobs(jobs.map((j) => (j.id === editingJob.id ? data : j)))
      }
    } else {
      const { data, error } = await supabase.from('jobs').insert(form).select().single()
      if (!error && data) {
        setJobs([data, ...jobs])
      }
    }

    setShowForm(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this job?')) return
    const supabase = createClient()
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (!error) {
      setJobs(jobs.filter((j) => j.id !== id))
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Reach Network Admin</h1>
        <button
          onClick={handleSignOut}
          className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('jobs')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'jobs' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'applications' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Applications ({applications.length})
          </button>
        </div>

        {tab === 'jobs' && (
          <div>
            <button
              onClick={openNewForm}
              className="mb-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Post New Job
            </button>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {job.category} · {job.location} · {job.employment_type} · {job.salary}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(job)}
                      className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && <p className="text-slate-500">No jobs posted yet.</p>}
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{app.name}</h3>
                    <p className="text-sm text-slate-500">
                      {app.email} {app.phone && `· ${app.phone}`}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      Applied to: {app.jobs?.title || 'Unknown role'}
                    </p>
                  </div>
                  {app.cv_url && (
                    <a
                      href={app.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg"
                    >
                      View CV
                    </a>
                  )}
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-slate-500">No applications yet.</p>}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input
                placeholder="Job title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Category (e.g. Warehouse, Driving)"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <select
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option>Temporary</option>
                <option>Permanent</option>
              </select>
              <input
                placeholder="Salary (e.g. £12.50/hr)"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                <option value="open">Open</option>
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
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
