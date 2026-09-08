'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAVY = '#0F2438'
const ORANGE = '#F7931E'

const DIMS: Record<Format, { w: number; h: number }> = {
  vertical: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
  landscape: { w: 1920, h: 1080 },
}

type Format = 'vertical' | 'square' | 'landscape'
type RecordingState = 'idle' | 'live' | 'outro'

const OUTRO_MS = 3500

const VIDEO_TYPES = ["We're recruiting", 'Meet the candidate', 'Vacancy spotlight', 'Client testimonial']

export default function VideoCreatorTab() {
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [videoType, setVideoType] = useState(VIDEO_TYPES[0])
  const [format, setFormat] = useState<Format>('vertical')

  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const logoImageRef = useRef<HTMLImageElement | null>(null)

  const [endCardDataUrl, setEndCardDataUrl] = useState<string | null>(null)
  const [endCardFile, setEndCardFile] = useState<File | null>(null)
  const endCardImageRef = useRef<HTMLImageElement | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [reviewMode, setReviewMode] = useState(false)
  const [downloads, setDownloads] = useState<Record<Format, string | null>>({
    vertical: null,
    square: null,
    landscape: null,
  })

  // Refs mirroring state so the requestAnimationFrame loop and
  // MediaRecorder callbacks always read current values, not stale
  // closures from when the loop first started.
  const formRef = useRef({ name, title, phone, email, videoType })
  const formatRef = useRef<Format>(format)
  const recordingStateRef = useRef<RecordingState>('idle')

  useEffect(() => {
    formRef.current = { name, title, phone, email, videoType }
  }, [name, title, phone, email, videoType])

  useEffect(() => {
    formatRef.current = format
  }, [format])

  useEffect(() => {
    recordingStateRef.current = recordingState
  }, [recordingState])

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const rafRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordStartRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      cameraStreamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }
      setCameraReady(true)
      setStatusMsg("Camera ready. Fill in your details, then hit Start Recording.")
    } catch (err: any) {
      setStatusMsg('Could not access camera/microphone: ' + err.message)
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        logoImageRef.current = img
        setLogoDataUrl(url)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  function handleEndCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEndCardFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        endCardImageRef.current = img
        setEndCardDataUrl(url)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  function drawRoundedText(ctx: CanvasRenderingContext2D) {
    // placeholder kept for potential future rounded backgrounds
  }

  function drawLogo(ctx: CanvasRenderingContext2D, cw: number) {
    const logo = logoImageRef.current
    if (!logo) return
    const targetH = cw * 0.09
    const targetW = targetH * (logo.width / logo.height)
    const pad = cw * 0.035
    ctx.drawImage(logo, pad, pad, targetW, targetH)
  }

  function drawOutroCard(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const endCard = endCardImageRef.current

    if (endCard) {
      // Cover-fit the uploaded end-card image to fill the canvas —
      // it already contains all the branding and contact details,
      // so no extra text is drawn on top of it.
      const scale = Math.max(cw / endCard.width, ch / endCard.height)
      const dw = endCard.width * scale
      const dh = endCard.height * scale
      ctx.fillStyle = NAVY
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(endCard, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
      return
    }

    // Fallback if no end card has been uploaded yet
    const { name, title, phone, email } = formRef.current

    ctx.fillStyle = NAVY
    ctx.fillRect(0, 0, cw, ch)

    ctx.textAlign = 'center'
    ctx.fillStyle = ORANGE
    ctx.font = `800 ${cw * 0.045}px -apple-system, Arial`
    ctx.fillText('JOIN REACH NETWORK', cw / 2, ch * 0.34)

    ctx.fillStyle = 'white'
    ctx.font = `800 ${cw * 0.055}px -apple-system, Arial`
    ctx.fillText(name || 'Reach Network Recruitment', cw / 2, ch * 0.46)

    if (title) {
      ctx.fillStyle = '#cbd5e1'
      ctx.font = `600 ${cw * 0.028}px -apple-system, Arial`
      ctx.fillText(title, cw / 2, ch * 0.51)
    }

    ctx.fillStyle = 'white'
    ctx.font = `700 ${cw * 0.032}px -apple-system, Arial`
    let y = ch * 0.6
    if (phone) {
      ctx.fillText('\u260E  ' + phone, cw / 2, y)
      y += cw * 0.06
    }
    if (email) {
      ctx.fillText('\u2709  ' + email, cw / 2, y)
    }

    const logo = logoImageRef.current
    if (logo) {
      const lw = cw * 0.22
      const lh = lw * (logo.height / logo.width)
      ctx.drawImage(logo, cw / 2 - lw / 2, ch * 0.78, lw, lh)
    }
  }

  function drawLowerThird(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const { name, title, phone } = formRef.current

    const barH = ch * 0.14
    const barY = ch - barH

    const grad = ctx.createLinearGradient(0, barY, 0, ch)
    grad.addColorStop(0, 'rgba(15,36,56,0)')
    grad.addColorStop(0.35, 'rgba(15,36,56,0.88)')
    grad.addColorStop(1, 'rgba(15,36,56,0.95)')
    ctx.fillStyle = grad
    ctx.fillRect(0, barY, cw, barH)

    ctx.fillStyle = ORANGE
    ctx.fillRect(cw * 0.035, barY + barH * 0.28, cw * 0.008, barH * 0.5)

    ctx.textAlign = 'left'
    ctx.fillStyle = 'white'
    ctx.font = `800 ${cw * 0.032}px -apple-system, Arial`
    ctx.fillText(name || 'Reach Network Recruitment', cw * 0.06, barY + barH * 0.42)

    ctx.fillStyle = '#cbd5e1'
    ctx.font = `600 ${cw * 0.02}px -apple-system, Arial`
    const subtitle = [title, phone].filter(Boolean).join('  \u00b7  ')
    ctx.fillText(subtitle, cw * 0.06, barY + barH * 0.68)
  }

  function renderFrame() {
    const canvas = stageCanvasRef.current
    const previewVideo = videoPreviewRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w: cw, h: ch } = DIMS[formatRef.current]
    canvas.width = cw
    canvas.height = ch

    const state = recordingStateRef.current

    if (state === 'outro') {
      drawOutroCard(ctx, cw, ch)
    } else if (state === 'live' && previewVideo) {
      const vw = previewVideo.videoWidth || 1280
      const vh = previewVideo.videoHeight || 720
      const scale = Math.max(cw / vw, ch / vh)
      const dw = vw * scale
      const dh = vh * scale
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cw, ch)
      ctx.drawImage(previewVideo, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
      drawLogo(ctx, cw)
      drawLowerThird(ctx, cw, ch)
    }

    rafRef.current = requestAnimationFrame(renderFrame)
  }

  function formatTimer(ms: number) {
    const totalSec = Math.floor(ms / 1000)
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0')
    const s = String(totalSec % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  function startRecording() {
    const canvas = stageCanvasRef.current
    const cameraStream = cameraStreamRef.current
    if (!canvas || !cameraStream) return

    const { w: cw, h: ch } = DIMS[formatRef.current]
    canvas.width = cw
    canvas.height = ch

    const canvasStream = (canvas as any).captureStream(30) as MediaStream
    const audioTrack = cameraStream.getAudioTracks()[0]
    if (audioTrack) canvasStream.addTrack(audioTrack)

    recordedChunksRef.current = []
    const recorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm;codecs=vp9,opus' })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }
    recorder.onstop = onRecordingStopped
    recorder.start()
    recorderRef.current = recorder

    setDownloads({ vertical: null, square: null, landscape: null })
    setRecordingState('live')
    recordingStateRef.current = 'live'
    setStatusMsg("Recording \u2014 click Stop when you're done.")

    renderFrame()

    recordStartRef.current = Date.now()
    timerIntervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - recordStartRef.current)
    }, 250)
  }

  function stopRecording() {
    if (recordingStateRef.current !== 'live') return
    setRecordingState('outro')
    recordingStateRef.current = 'outro'
    setStatusMsg('Wrapping up with your contact card\u2026')

    setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
    }, OUTRO_MS)
  }

  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [uploadingShare, setUploadingShare] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [copyLabel, setCopyLabel] = useState('Copy link')

  function onRecordingStopped() {
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
    setStatusMsg('Processing your export formats\u2026')
    setRecordingState('idle')
    recordingStateRef.current = 'idle'
    setElapsedMs(0)
    setShareUrl(null)
    setShareError(null)

    const primaryFmt = formatRef.current
    const primaryUrl = URL.createObjectURL(blob)
    setDownloads((prev) => ({ ...prev, [primaryFmt]: primaryUrl }))
    setReviewMode(true)
    setStatusMsg('Your video is ready \u2014 press play below to check it before downloading.')

    const others = (Object.keys(DIMS) as Format[]).filter((f) => f !== primaryFmt)
    others.forEach((fmt) => reencodeFormat(blob, fmt))

    uploadAndCreateShareLink(blob)
  }

  async function uploadAndCreateShareLink(blob: Blob) {
    setUploadingShare(true)
    setShareError(null)

    try {
      const supabase = createClient()
      const slug = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

      const videoPath = `videos/${slug}.webm`
      const { error: videoUploadError } = await supabase.storage
        .from('recruitment-videos')
        .upload(videoPath, blob, { contentType: 'video/webm' })
      if (videoUploadError) throw videoUploadError

      const { data: videoUrlData } = supabase.storage
        .from('recruitment-videos')
        .getPublicUrl(videoPath)

      let thumbnailUrl: string | null = null
      if (endCardFile) {
        const thumbPath = `thumbnails/${slug}-${endCardFile.name}`
        const { error: thumbError } = await supabase.storage
          .from('recruitment-videos')
          .upload(thumbPath, endCardFile, { contentType: endCardFile.type })
        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('recruitment-videos')
            .getPublicUrl(thumbPath)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      }

      const { name, title, phone, email, videoType } = formRef.current

      const { error: insertError } = await supabase.from('recruitment_videos').insert({
        slug,
        video_url: videoUrlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        name,
        title,
        phone,
        email,
        video_type: videoType,
      })
      if (insertError) throw insertError

      setShareUrl(`${window.location.origin}/watch/${slug}`)
    } catch (err: any) {
      console.error('Share link upload failed:', err)
      setShareError(
        'Could not create a shareable link (' +
          (err?.message || 'unknown error') +
          '). You can still download the video below.'
      )
    } finally {
      setUploadingShare(false)
    }
  }

  function copyShareLink() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopyLabel('Copied!')
    setTimeout(() => setCopyLabel('Copy link'), 2000)
  }

  function recordAnother() {
    setReviewMode(false)
    setDownloads({ vertical: null, square: null, landscape: null })
    setStatusMsg(cameraReady ? 'Ready when you are \u2014 hit Start Recording.' : '')
    if (videoPreviewRef.current && cameraStreamRef.current) {
      videoPreviewRef.current.srcObject = cameraStreamRef.current
    }
  }

  function reencodeFormat(sourceBlob: Blob, fmt: Format) {
    const { w: cw, h: ch } = DIMS[fmt]
    const off = document.createElement('canvas')
    off.width = cw
    off.height = ch
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    const vid = document.createElement('video')
    vid.src = URL.createObjectURL(sourceBlob)
    vid.muted = false
    vid.playsInline = true

    vid.onloadedmetadata = () => {
      const stream = (off as any).captureStream(30) as MediaStream
      const audioCtx = new AudioContext()
      const srcNode = audioCtx.createMediaElementSource(vid)
      const dest = audioCtx.createMediaStreamDestination()
      srcNode.connect(dest)
      srcNode.connect(audioCtx.destination)
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t))

      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
      const chunks: Blob[] = []
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      rec.onstop = () => {
        const outBlob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(outBlob)
        setDownloads((prev) => ({ ...prev, [fmt]: url }))
        audioCtx.close()
      }

      let raf: number
      function draw() {
        if (vid.paused || vid.ended) return
        const vw = vid.videoWidth
        const vh = vid.videoHeight
        const scale = Math.max(cw / vw, ch / vh)
        const dw = vw * scale
        const dh = vh * scale
        offCtx!.fillStyle = '#000'
        offCtx!.fillRect(0, 0, cw, ch)
        offCtx!.drawImage(vid, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
        raf = requestAnimationFrame(draw)
      }

      rec.start()
      vid.play()
      draw()
      vid.onended = () => {
        cancelAnimationFrame(raf)
        rec.stop()
      }
    }
  }

  const isRecording = recordingState !== 'idle'
  const isLive = recordingState === 'live'

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      {/* SETTINGS PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Job title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recruitment Consultant"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xxx xxx xxx"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@reachnetworkrec.com"
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Video type</label>
          <select
            value={videoType}
            onChange={(e) => setVideoType(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {VIDEO_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your logo</label>
          <label className="mt-1 block border border-dashed border-slate-400 rounded-lg px-3 py-2.5 text-xs font-semibold text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
            Upload logo (PNG works best)
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {logoDataUrl && (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-600">
              <img src={logoDataUrl} alt="Logo" className="h-7 rounded" />
              Logo loaded
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            End card (shown for the last few seconds)
          </label>
          <label className="mt-1 block border border-dashed border-slate-400 rounded-lg px-3 py-2.5 text-xs font-semibold text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
            Upload your branded contact card image
            <input type="file" accept="image/*" onChange={handleEndCardUpload} className="hidden" />
          </label>
          {endCardDataUrl && (
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-600">
              <img src={endCardDataUrl} alt="End card" className="h-7 rounded" />
              End card loaded
            </div>
          )}
          {!endCardDataUrl && (
            <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
              Without this, a simple text card is shown instead.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Export format</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(['vertical', 'square', 'landscape'] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`rounded-lg border-2 px-2 py-2 text-[11px] font-bold text-center ${
                  format === f
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {f === 'vertical' && '9:16'}
                {f === 'square' && '1:1'}
                {f === 'landscape' && '16:9'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
            This sets the shape you record in. The other two shapes export automatically afterwards from the same take.
          </p>
        </div>
      </div>

      {/* RECORDER PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="relative rounded-xl overflow-hidden bg-black">
          {isRecording && (
            <span className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              RECORDING
            </span>
          )}
          <video
            ref={videoPreviewRef}
            autoPlay
            muted
            playsInline
            className={`w-full block ${reviewMode ? 'hidden' : ''}`}
          />
          {reviewMode && downloads[format] && (
            <video src={downloads[format]!} controls autoPlay className="w-full block" />
          )}
          <canvas ref={stageCanvasRef} className="hidden" />
        </div>

        {reviewMode && (
          <div className="mt-3">
            <button
              type="button"
              onClick={recordAnother}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-lg"
            >
              ↻ Record Another
            </button>
          </div>
        )}

        {reviewMode && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shareable link</p>
            {uploadingShare && (
              <p className="mt-2 text-sm font-semibold text-orange-600">Creating your shareable link…</p>
            )}
            {shareUrl && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  {copyLabel}
                </button>
              </div>
            )}
            {shareUrl && (
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Paste this anywhere — LinkedIn, WhatsApp, email. It opens a branded watch page with a button
                through to reachnetworkrec.com. Note: LinkedIn (and most platforms) show a static preview image for
                external links rather than an autoplaying clip — that autoplay-in-feed effect only happens for
                videos uploaded directly into a LinkedIn post.
              </p>
            )}
            {shareError && <p className="mt-2 text-xs font-semibold text-red-600">{shareError}</p>}
          </div>
        )}

        <div className={`mt-4 flex flex-wrap items-center gap-2.5 ${reviewMode ? 'hidden' : ''}`}>
          <button
            type="button"
            onClick={startCamera}
            disabled={cameraReady}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-lg"
          >
            🎥 Start Camera
          </button>
          <button
            type="button"
            onClick={startRecording}
            disabled={!cameraReady || isRecording}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-lg"
          >
            ● Start Recording
          </button>
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isLive}
            className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-bold text-sm px-5 py-2.5 rounded-lg"
          >
            Stop
          </button>
          <span className="text-sm font-bold text-slate-500 tabular-nums">{formatTimer(elapsedMs)}</span>
        </div>

        {statusMsg && <p className="mt-3 text-sm font-semibold text-orange-600">{statusMsg}</p>}

        {(downloads.vertical || downloads.square || downloads.landscape) && (
          <div className="mt-5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Download your branded video
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {(['vertical', 'square', 'landscape'] as Format[]).map((f) => (
                <div key={f} className="border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-bold text-slate-500 mb-2">
                    {f === 'vertical' && 'Vertical (9:16)'}
                    {f === 'square' && 'Square (1:1)'}
                    {f === 'landscape' && 'Landscape (16:9)'}
                  </p>
                  {downloads[f] ? (
                    <a
                      href={downloads[f]!}
                      download={`reach-network-${f}.webm`}
                      className="block w-full bg-slate-900 text-white text-xs font-bold py-2 rounded-lg"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="block w-full bg-slate-200 text-slate-400 text-xs font-bold py-2 rounded-lg">
                      Preparing…
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
          Recordings are processed entirely in your browser — nothing is uploaded anywhere. Files download as{' '}
          <b>.webm</b>, which plays and uploads fine on Instagram, TikTok, YouTube and Facebook. Use Chrome or Edge for
          best results, and allow camera/microphone access when prompted.
        </p>
      </div>
    </div>
  )
}