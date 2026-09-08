'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import VideoCreatorTab from './VideoCreatorTab'
import CampaignsTab from './CampaignsTab'
import DocumentsTab from './DocumentsTab'

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

type Alert = {
  id: string
  email: string
  created_at: string
}

type Post = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  featured: boolean
  published: boolean
  created_at: string
}

const CATEGORIES = ['CV & Applications', 'Interviews', 'Career Development', 'Finding Work', 'Industry Advice']

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function DashboardClient({
  initialJobs,
  initialApplications,
  initialAlerts,
  initialPosts,
}: {
  initialJobs: Job[]
  initialApplications: Application[]
  initialAlerts: Alert[]
  initialPosts: Post[]
}) {
  const [jobs, setJobs] = useState(initialJobs)
  const [applications, setApplications] = useState(initialApplications)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [posts, setPosts] = useState(initialPosts)
  const [tab, setTab] = useState<'jobs' | 'applications' | 'alerts' | 'blog' | 'video' | 'campaigns' | 'documents'>('jobs')
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

  const [showPostForm, setShowPostForm] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [postForm, setPostForm] = useState({
    title: '',
    category: CATEGORIES[0],
    excerpt: '',
    content: '',
    featured: false,
    published: false,
  })
  const [postCoverFile, setPostCoverFile] = useState<File | null>(null)
  const [postSaving, setPostSaving] = useState(false)

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

  async function handleDeleteAlert(id: string) {
    if (!confirm('Delete this alert?')) return
    const supabase = createClient()
    const { error } = await supabase.from('job_alerts').delete().eq('id', id)
    if (!error) {
      setAlerts(alerts.filter((a) => a.id !== id))
    }
  }

  function openNewPost() {
    setEditingPost(null)
    setPostForm({
      title: '',
      category: CATEGORIES[0],
      excerpt: '',
      content: '',
      featured: false,
      published: false,
    })
    setPostCoverFile(null)
    setShowPostForm(true)
  }

  function openEditPost(post: Post) {
    setEditingPost(post)
    setPostForm({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured: post.featured,
      published: post.published,
    })
    setPostCoverFile(null)
    setShowPostForm(true)
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault()
    setPostSaving(true)
    const supabase = createClient()

    try {
      let coverUrl = editingPost?.cover_image_url || null

      if (postCoverFile) {
        const fileName = `${Date.now()}-${postCoverFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, postCoverFile)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(uploadData.path)
        coverUrl = urlData.publicUrl
      }

      const slug = editingPost ? editingPost.slug : slugify(postForm.title)

      const payload = {
        title: postForm.title,
        slug,
        category: postForm.category,
        excerpt: postForm.excerpt,
        content: postForm.content,
        cover_image_url: coverUrl,
        featured: postForm.featured,
        published: postForm.published,
        updated_at: new Date().toISOString(),
      }

      if (editingPost) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', editingPost.id)
          .select()
          .single()
        if (error) throw error
        setPosts(posts.map((p) => (p.id === editingPost.id ? data : p)))
      } else {
        const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
        if (error) throw error
        setPosts([data, ...posts])
      }

      setShowPostForm(false)
    } catch (err) {
      console.error(err)
      alert('Something went wrong saving the post — check the console for details.')
    } finally {
      setPostSaving(false)
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Delete this post?')) return
    const supabase = createClient()
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (!error) {
      setPosts(posts.filter((p) => p.id !== id))
    }
  }

  async function handleTogglePublish(post: Post) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ published: !post.published })
      .eq('id', post.id)
      .select()
      .single()
    if (!error && data) {
      setPosts(posts.map((p) => (p.id === post.id ? data : p)))
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
        <div className="flex gap-2 mb-6 flex-wrap">
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
          <button
            onClick={() => setTab('alerts')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'alerts' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setTab('blog')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'blog' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Blog ({posts.length})
          </button>
          <button
            onClick={() => setTab('video')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'video' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setTab('campaigns')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'campaigns' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setTab('documents')}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === 'documents' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Documents
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
                      {app.jobs?.title ? `Applied to: ${app.jobs.title}` : 'General CV upload (no specific role)'}
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

        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{alert.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Signed up {new Date(alert.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                >
                  Delete
                </button>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-slate-500">No job alert signups yet.</p>}
          </div>
        )}

        {tab === 'blog' && (
          <div>
            <button
              onClick={openNewPost}
              className="mb-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition"
            >
              + Write New Post
            </button>

            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{post.title}</h3>
                      {post.featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Featured</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          post.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{post.category}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1"
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => openEditPost(post)}
                      className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="text-slate-500">No blog posts yet.</p>}
            </div>
          </div>
        )}

        {tab === 'video' && <VideoCreatorTab />}

        {tab === 'campaigns' && <CampaignsTab />}

        {tab === 'documents' && <DocumentsTab />}
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

      {showPostForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">{editingPost ? 'Edit Post' : 'Write New Post'}</h2>
            <form onSubmit={handleSavePost} className="space-y-3">
              <input
                placeholder="Post title"
                required
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <select
                value={postForm.category}
                onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <textarea
                placeholder="Short excerpt (shown in listings)"
                value={postForm.excerpt}
                onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <textarea
                placeholder="Full article content"
                required
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                rows={10}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Cover image {editingPost?.cover_image_url && '(leave blank to keep existing)'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPostCoverFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-xs text-slate-500"
                />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={postForm.featured}
                    onChange={(e) => setPostForm({ ...postForm, featured: e.target.checked })}
                  />
                  Featured post
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={postForm.published}
                    onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                  />
                  Published (visible on site)
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={postSaving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {postSaving ? 'Saving...' : 'Save Post'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
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