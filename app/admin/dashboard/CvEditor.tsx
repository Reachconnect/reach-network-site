'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CvData = {
  name: string
  title: string
  email: string
  phone: string
  location: string
  body: string
}

function emptyCvData(): CvData {
  return { name: '', title: '', email: '', phone: '', location: '', body: '' }
}

// Splits the body text into sections by "## Heading" markers, so
// the live preview can render it looking like the real CV instead
// of a raw blob of text.
function parseSections(body: string) {
  const lines = (body || '').split('\n')
  const sections: { heading: string; text: string }[] = []
  let current: { heading: string; text: string } | null = null

  for (const line of lines) {
    if (line.trim().startsWith('## ')) {
      current = { heading: line.trim().slice(3).trim(), text: '' }
      sections.push(current)
    } else if (current) {
      current.text += line + '\n'
    }
  }

  return sections.map((s) => ({ heading: s.heading, text: s.text.trim() }))
}

export default function CvEditor({
  candidateId,
  candidateCvPath,
  existingFormattedCv,
  onClose,
}: {
  candidateId: string
  candidateCvPath: string | null
  existingFormattedCv: CvData | null
  onClose: () => void
}) {
  const [cvData, setCvData] = useState<CvData>({ ...emptyCvData(), ...(existingFormattedCv || {}) })
  const [loading, setLoading] = useState(!existingFormattedCv && !!candidateCvPath)
  const [saving, setSaving] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [sendEmail, setSendEmail] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [originalPages, setOriginalPages] = useState<string[]>([])
  const [loadingOriginal, setLoadingOriginal] = useState(!!candidateCvPath)

  useEffect(() => {
    if (candidateCvPath) {
      loadOriginalAndMaybeExtract()
    }
  }, [])

  async function loadOriginalAndMaybeExtract() {
    if (!existingFormattedCv) setLoading(true)
    setLoadingOriginal(true)
    try {
      const supabase = createClient()
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('candidate-cvs')
        .createSignedUrl(candidateCvPath!, 300)
      if (signedUrlError || !signedUrlData) throw new Error('Could not access the original CV')

      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const pdf = await pdfjsLib.getDocument({ url: signedUrlData.signedUrl }).promise

      // Render each page as an image for the side-by-side reference
      // panel, and extract the text at the same time (so the PDF
      // only has to be loaded once, whether or not we end up
      // needing the extracted text for AI parsing below).
      const images: string[] = []
      let fullText = ''
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.3 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, canvas, viewport }).promise
        images.push(canvas.toDataURL('image/png'))

        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n'
      }
      setOriginalPages(images)
      setLoadingOriginal(false)

      if (existingFormattedCv) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/parse-full-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: fullText }),
      })
      const result = await res.json()

      if (res.ok) {
        setCvData({
          name: result.name || '',
          title: result.title || '',
          email: result.email || '',
          phone: result.phone || '',
          location: result.location || '',
          body: result.body || '',
        })
      } else {
        setStatusMsg('Could not auto-extract the CV — you can still write it in below.')
      }
    } catch (err: any) {
      setStatusMsg('Could not read the original CV — you can still write it in below.')
      setLoadingOriginal(false)
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: keyof CvData, value: string) {
    setCvData({ ...cvData, [field]: value })
  }

  async function handleGenerate(alsoSend: boolean) {
    setSaving(true)
    setStatusMsg(null)
    setDownloadUrl(null)
    try {
      const res = await fetch('/api/generate-formatted-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          cvData,
          sendToEmail: alsoSend ? sendEmail.trim() : null,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to generate')

      setDownloadUrl(result.downloadUrl)
      setStatusMsg(alsoSend ? `PDF generated and emailed to ${sendEmail}.` : 'PDF generated — ready to download.')
    } catch (err: any) {
      setStatusMsg('Error: ' + (err?.message || 'unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const previewSections = parseSections(cvData.body)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[1500px] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Format CV</h2>
          <button onClick={onClose} className="text-2xl text-slate-400 leading-none">
            &times;
          </button>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr_380px] gap-5">
            {/* ORIGINAL CV REFERENCE */}
            <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 lg:sticky lg:top-0 lg:max-h-[80vh] lg:overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Original CV</p>
              {loadingOriginal ? (
                <p className="text-xs text-slate-400 py-6 text-center">Loading original…</p>
              ) : originalPages.length > 0 ? (
                <div className="space-y-3">
                  {originalPages.map((src, i) => (
                    <img key={i} src={src} alt={`Page ${i + 1}`} className="w-full rounded-lg border border-slate-200" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No original CV on file.</p>
              )}
            </div>

            {/* EDIT AREA */}
            <div>
              {loading && (
                <p className="text-sm font-semibold text-orange-600 mb-3">
                  Extracting content from the CV — feel free to reference the original on the left while you wait…
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  placeholder="Full name"
                  value={cvData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Professional title (e.g. HGV Class 1 Driver)"
                  value={cvData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Email"
                  value={cvData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Phone"
                  value={cvData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Location"
                  value={cvData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm col-span-2"
                />
              </div>

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                CV content — edit freely, just like a document
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Start a new section with "## " (e.g. "## Experience"). Leave a blank line between entries.
              </p>
              <textarea
                value={cvData.body}
                onChange={(e) => updateField('body', e.target.value)}
                rows={26}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono leading-relaxed"
              />
            </div>

            {/* PREVIEW + ACTIONS */}
            <div>
              <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 sticky top-0">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Preview</p>
                <div className="bg-white rounded-lg border border-slate-200 p-5 text-xs max-h-[500px] overflow-y-auto">
                  <p className="font-bold text-[#0F2438]">
                    REACH<span className="text-orange-500">NETWORK</span>
                  </p>
                  <p className="mt-3 text-lg font-bold text-[#0F2438]">{cvData.name || 'Candidate Name'}</p>
                  {cvData.title && <p className="text-orange-500 font-semibold">{cvData.title}</p>}
                  <p className="text-slate-400 mt-1">
                    {[cvData.email, cvData.phone, cvData.location].filter(Boolean).join(' · ')}
                  </p>

                  {previewSections.map((section, i) => (
                    <div key={i} className="mt-3">
                      <p className="font-bold text-orange-500 uppercase text-[10px]">{section.heading}</p>
                      <div className="text-slate-600 mt-1 whitespace-pre-line">{section.text}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleGenerate(false)}
                    disabled={saving}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    {saving ? 'Generating…' : 'Generate PDF'}
                  </button>

                  <input
                    type="email"
                    placeholder="Client email to send to (optional)"
                    value={sendEmail}
                    onChange={(e) => setSendEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => handleGenerate(true)}
                    disabled={saving || !sendEmail.trim()}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-50"
                  >
                    Generate &amp; Send to Client
                  </button>

                  {statusMsg && <p className="text-xs font-semibold text-slate-600">{statusMsg}</p>}

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg text-sm"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}