'use client'

import { useEffect, useRef, useState } from 'react'

type Field = {
  id: string
  signer_id: string
  field_type: 'signature' | 'initials' | 'date' | 'text'
  label: string | null
  page_number: number
  x_pct: number
  y_pct: number
  width_pct: number
  height_pct: number
  value: string | null
}

type Signer = {
  id: string
  name: string
  email: string
  role_label: string | null
  status: string
  signature_image_url: string | null
  initials_image_url: string | null
}

type Envelope = { id: string; name: string; status: string }
type PdfDoc = { id: string; name: string; original_pdf_url: string }

function SignaturePad({ onCapture, height = 140 }: { onCapture: (dataUrl: string) => void; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const [mode, setMode] = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName] = useState('')

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    drawingRef.current = true
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#0F2438'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endDraw() {
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) onCapture(canvas.toDataURL('image/png'))
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  function captureTyped(name: string) {
    setTypedName(name)
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 120
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'transparent'
    ctx.font = "48px 'Brush Script MT', cursive"
    ctx.fillStyle = '#0F2438'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, 20, 60)
    onCapture(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${mode === 'draw' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${mode === 'type' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div>
          <canvas
            ref={canvasRef}
            width={500}
            height={height}
            className="border border-slate-300 rounded-lg bg-white w-full touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          <button type="button" onClick={clearCanvas} className="text-xs text-slate-400 font-semibold mt-1">
            Clear
          </button>
        </div>
      ) : (
        <input
          placeholder="Type your name"
          value={typedName}
          onChange={(e) => captureTyped(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-3 text-2xl"
          style={{ fontFamily: "'Brush Script MT', cursive" }}
        />
      )}
    </div>
  )
}

export default function SigningClient({
  token,
  signer,
  envelope,
  document: pdfDoc,
  fields,
}: {
  token: string
  signer: Signer
  envelope: Envelope
  document: PdfDoc
  fields: Field[]
}) {
  const [pageImages, setPageImages] = useState<string[]>([])
  const [rendering, setRendering] = useState(true)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [initialsDataUrl, setInitialsDataUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myFields = fields.filter((f) => f.signer_id === signer.id)
  const otherCompletedFields = fields.filter((f) => f.signer_id !== signer.id && f.value)

  const needsSignature = myFields.some((f) => f.field_type === 'signature')
  const needsInitials = myFields.some((f) => f.field_type === 'initials')
  const today = new Date().toLocaleDateString('en-GB')

  useEffect(() => {
    renderPdf()
  }, [])

  async function renderPdf() {
    setRendering(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      if (!pdfDoc.original_pdf_url) {
        throw new Error('This document has no file URL.')
      }
      const pdf = await pdfjsLib.getDocument({ url: pdfDoc.original_pdf_url }).promise
      const images: string[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        images.push(canvas.toDataURL('image/png'))
      }

      setPageImages(images)
    } catch (err) {
      console.error('PDF render error:', err)
    } finally {
      setRendering(false)
    }
  }

  function allFieldsFilled() {
    for (const field of myFields) {
      if (field.field_type === 'signature' && !signatureDataUrl) return false
      if (field.field_type === 'initials' && !initialsDataUrl) return false
      if (field.field_type === 'text' && !fieldValues[field.id]?.trim()) return false
    }
    return true
  }

  async function handleSubmit() {
    if (!allFieldsFilled()) {
      setError('Please fill in every field before submitting.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/envelopes/submit-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fieldValues,
          signatureDataUrl,
          initialsDataUrl,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Submission failed')
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (signer.status === 'signed' || submitted) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">You're all signed</h1>
          <p className="mt-2 text-slate-500">
            Thanks, {signer.name.split(' ')[0]}. A copy will be emailed to you once everyone has signed.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-slate-900">{envelope.name}</h1>
        <p className="text-sm text-slate-500">Signing as {signer.name}</p>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {rendering && <p className="text-center text-slate-500 py-10">Loading document…</p>}

        {pageImages.map((src, i) => (
          <div key={i} className="relative mb-4 bg-white shadow-sm rounded-lg overflow-hidden">
            <img src={src} alt={`Page ${i + 1}`} className="w-full block" />

            {otherCompletedFields
              .filter((f) => f.page_number === i + 1)
              .map((f) => (
                <div
                  key={f.id}
                  className="absolute border border-slate-300 bg-slate-50/90 rounded flex items-center justify-center text-[10px] text-slate-400 font-semibold px-1 overflow-hidden"
                  style={{
                    left: `${f.x_pct}%`,
                    top: `${f.y_pct}%`,
                    width: `${f.width_pct}%`,
                    height: `${f.height_pct}%`,
                  }}
                >
                  {f.field_type === 'signature' || f.field_type === 'initials' ? (
                    <span className="italic">Signed</span>
                  ) : (
                    f.value
                  )}
                </div>
              ))}

            {myFields
              .filter((f) => f.page_number === i + 1)
              .map((f) => (
                <div
                  key={f.id}
                  className="absolute border-2 border-orange-400 bg-orange-50/70 rounded flex items-center justify-center text-[10px] font-bold text-orange-700 px-1"
                  style={{
                    left: `${f.x_pct}%`,
                    top: `${f.y_pct}%`,
                    width: `${f.width_pct}%`,
                    height: `${f.height_pct}%`,
                  }}
                >
                  {f.field_type === 'date'
                    ? today
                    : f.field_type === 'text'
                    ? fieldValues[f.id] || f.label
                    : f.field_type === 'signature'
                    ? (signatureDataUrl ? '✓ Signed below' : '↓ Sign below')
                    : initialsDataUrl
                    ? '✓ Initialed below'
                    : '↓ Initial below'}
                </div>
              ))}
          </div>
        ))}

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <h2 className="font-bold text-slate-800">Fill in your details</h2>

          {myFields
            .filter((f) => f.field_type === 'text')
            .map((f) => (
              <div key={f.id}>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{f.label}</label>
                <input
                  value={fieldValues[f.id] || ''}
                  onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}

          {needsSignature && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your signature</label>
              <div className="mt-1">
                <SignaturePad onCapture={setSignatureDataUrl} />
              </div>
            </div>
          )}

          {needsInitials && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your initials</label>
              <div className="mt-1">
                <SignaturePad onCapture={setInitialsDataUrl} height={90} />
              </div>
            </div>
          )}

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-lg disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Finish Signing'}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            By clicking "Finish Signing" you agree this constitutes your electronic signature, legally binding to
            the same extent as a handwritten signature.
          </p>
        </div>
      </div>
    </main>
  )
}