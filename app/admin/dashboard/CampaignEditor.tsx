'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ColumnItem = {
  imageSrc?: string
  imageAlt?: string
  imageLink?: string
  heading?: string
  text?: string
  buttonText?: string
  buttonLink?: string
}

export type Block =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'paragraph'; text: string }
  | { id: string; type: 'image'; src: string; alt: string; link: string }
  | { id: string; type: 'video'; videoUrl: string; thumbnailSrc: string }
  | { id: string; type: 'button'; text: string; link: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; height: number }
  | { id: string; type: 'columns'; left: ColumnItem; right: ColumnItem }

const NAVY = '#0F2438'
const ORANGE = '#F7931E'

function newBlock(type: Block['type']): Block {
  const id = crypto.randomUUID()
  switch (type) {
    case 'heading':
      return { id, type: 'heading', text: 'Your heading here' }
    case 'paragraph':
      return { id, type: 'paragraph', text: 'Write your message here.' }
    case 'image':
      return { id, type: 'image', src: '', alt: '', link: '' }
    case 'video':
      return { id, type: 'video', videoUrl: '', thumbnailSrc: '' }
    case 'button':
      return { id, type: 'button', text: 'Book a call', link: 'https://www.reachnetworkrec.com/book-a-call' }
    case 'divider':
      return { id, type: 'divider' }
    case 'spacer':
      return { id, type: 'spacer', height: 24 }
    case 'columns':
      return { id, type: 'columns', left: {}, right: {} }
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderColumnItem(item: ColumnItem): string {
  const parts: string[] = []
  if (item.imageSrc) {
    const img = `<img src="${item.imageSrc}" alt="${escapeHtml(item.imageAlt || '')}" style="width:100%;display:block;border:0;border-radius:8px;" />`
    parts.push(item.imageLink ? `<a href="${item.imageLink}">${img}</a>` : img)
  }
  if (item.heading) {
    parts.push(
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;color:${NAVY};margin-top:10px;">${escapeHtml(item.heading)}</div>`
    )
  }
  if (item.text) {
    parts.push(
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#334155;margin-top:6px;">${escapeHtml(item.text).replace(/\n/g, '<br/>')}</div>`
    )
  }
  if (item.buttonText && item.buttonLink) {
    parts.push(
      `<div style="margin-top:10px;"><a href="${item.buttonLink}" style="background:${ORANGE};color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:700;font-family:Arial,Helvetica,sans-serif;font-size:13px;display:inline-block;">${escapeHtml(item.buttonText)}</a></div>`
    )
  }
  return parts.join('')
}

export function compileBlocksToHtml(blocks: Block[]): string {
  const rows = blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<tr><td style="padding:20px 28px 6px;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800;color:${NAVY};">${escapeHtml(block.text)}</td></tr>`
        case 'paragraph':
          return `<tr><td style="padding:8px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(block.text).replace(/\n/g, '<br/>')}</td></tr>`
        case 'image': {
          const img = `<img src="${block.src}" alt="${escapeHtml(block.alt)}" style="width:100%;max-width:544px;display:block;border:0;" />`
          const wrapped = block.link ? `<a href="${block.link}">${img}</a>` : img
          return `<tr><td style="padding:8px 28px;">${wrapped}</td></tr>`
        }
        case 'video': {
          if (!block.thumbnailSrc) return ''
          const img = `<img src="${block.thumbnailSrc}" alt="Watch video" style="width:100%;max-width:544px;display:block;border:0;border-radius:8px;" />`
          const wrapped = block.videoUrl ? `<a href="${block.videoUrl}">${img}</a>` : img
          return `<tr><td style="padding:8px 28px;">${wrapped}</td></tr>`
        }
        case 'button':
          return `<tr><td align="center" style="padding:18px 28px;"><a href="${block.link}" style="background:${ORANGE};color:#ffffff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-family:Arial,Helvetica,sans-serif;font-size:15px;display:inline-block;">${escapeHtml(block.text)}</a></td></tr>`
        case 'divider':
          return `<tr><td style="padding:16px 28px;"><hr style="border:none;border-top:1px solid #e2e8f0;" /></td></tr>`
        case 'spacer':
          return `<tr><td style="height:${block.height}px;line-height:${block.height}px;font-size:1px;">&nbsp;</td></tr>`
        case 'columns':
          return `<tr><td style="padding:8px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="vertical-align:top;">${renderColumnItem(block.left)}</td>
                <td width="4%">&nbsp;</td>
                <td width="48%" style="vertical-align:top;">${renderColumnItem(block.right)}</td>
              </tr>
            </table>
          </td></tr>`
      }
    })
    .join('\n')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;max-width:600px;width:100%;">
      ${rows}
    </table>
  </td></tr>
</table>`
}

const BLOCK_META: Record<Block['type'], { label: string; icon: string; accent: string }> = {
  heading: { label: 'Heading', icon: 'H', accent: '#0F2438' },
  paragraph: { label: 'Text', icon: '¶', accent: '#64748b' },
  image: { label: 'Image', icon: '▨', accent: '#0ea5e9' },
  video: { label: 'Video', icon: '▶', accent: '#dc2626' },
  button: { label: 'Button', icon: '▭', accent: '#F7931E' },
  divider: { label: 'Divider', icon: '—', accent: '#94a3b8' },
  spacer: { label: 'Spacer', icon: '↕', accent: '#94a3b8' },
  columns: { label: 'Side by side', icon: '▥', accent: '#7c3aed' },
}

// Draws a play-button directly onto the uploaded image's pixels, so
// the "this is a video" affordance survives in every email client —
// no email client reliably renders CSS overlays, but every client
// renders a plain image correctly.
async function compositePlayButton(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))

        ctx.drawImage(img, 0, 0)

        const cx = canvas.width / 2
        const cy = canvas.height / 2
        const r = Math.min(canvas.width, canvas.height) * 0.13

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(15,36,56,0.72)'
        ctx.fill()

        const t = r * 0.85
        ctx.beginPath()
        ctx.moveTo(cx - t * 0.35, cy - t * 0.55)
        ctx.lineTo(cx - t * 0.35, cy + t * 0.55)
        ctx.lineTo(cx + t * 0.65, cy)
        ctx.closePath()
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Could not create image'))
        }, 'image/png')
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export default function CampaignEditor({
  initialBlocks,
  onChange,
}: {
  initialBlocks: Block[]
  onChange: (blocks: Block[]) => void
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function update(next: Block[]) {
    setBlocks(next)
    onChange(next)
  }

  function addBlock(type: Block['type']) {
    update([...blocks, newBlock(type)])
  }

  function updateBlock(id: string, patch: Partial<Block>) {
    update(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)))
  }

  function removeBlock(id: string) {
    update(blocks.filter((b) => b.id !== id))
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = blocks.findIndex((b) => b.id === id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    update(next)
  }

  function insertToken(id: string, token: string) {
    const block = blocks.find((b) => b.id === id) as any
    if (!block) return
    updateBlock(id, { text: (block.text || '') + token } as any)
  }

  async function handleImageUpload(id: string, file: File) {
    setUploadingId(id)
    try {
      const supabase = createClient()
      const path = `email-images/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('email-assets').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
      updateBlock(id, { src: data.publicUrl } as any)
    } catch (err: any) {
      alert('Image upload failed: ' + (err?.message || 'unknown error'))
    } finally {
      setUploadingId(null)
    }
  }

  async function handleVideoThumbnailUpload(id: string, file: File) {
    setUploadingId(id)
    try {
      const composited = await compositePlayButton(file)
      const supabase = createClient()
      const path = `email-video-thumbs/${Date.now()}-thumb.png`
      const { error } = await supabase.storage.from('email-assets').upload(path, composited, {
        contentType: 'image/png',
      })
      if (error) throw error
      const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
      updateBlock(id, { thumbnailSrc: data.publicUrl } as any)
    } catch (err: any) {
      alert('Thumbnail upload failed: ' + (err?.message || 'unknown error'))
    } finally {
      setUploadingId(null)
    }
  }

  async function handleColumnImageUpload(blockId: string, side: 'left' | 'right', file: File) {
    setUploadingId(blockId + side)
    try {
      const supabase = createClient()
      const path = `email-images/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('email-assets').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
      const block = blocks.find((b) => b.id === blockId) as any
      updateBlock(blockId, {
        [side]: { ...block[side], imageSrc: data.publicUrl },
      } as any)
    } catch (err: any) {
      alert('Image upload failed: ' + (err?.message || 'unknown error'))
    } finally {
      setUploadingId(null)
    }
  }

  function updateColumn(blockId: string, side: 'left' | 'right', patch: Partial<ColumnItem>) {
    const block = blocks.find((b) => b.id === blockId) as any
    if (!block) return
    updateBlock(blockId, { [side]: { ...block[side], ...patch } } as any)
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return
    const fromIndex = blocks.findIndex((b) => b.id === draggedId)
    const toIndex = blocks.findIndex((b) => b.id === targetId)
    const next = [...blocks]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    update(next)
    setDraggedId(null)
  }

  const previewHtml = `<div style="font-family:Arial,Helvetica,sans-serif;">${compileBlocksToHtml(blocks)}</div>`

  function ColumnEditor({ blockId, side, item }: { blockId: string; side: 'left' | 'right'; item: ColumnItem }) {
    const uploadKey = blockId + side
    return (
      <div className="rounded-lg border border-slate-200 p-3 space-y-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          {side === 'left' ? 'Left column' : 'Right column'}
        </p>
        {item.imageSrc ? (
          <div>
            <img src={item.imageSrc} className="max-h-24 rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={() => updateColumn(blockId, side, { imageSrc: '' })}
              className="text-[11px] text-red-600 font-semibold mt-1"
            >
              Remove image
            </button>
          </div>
        ) : (
          <label className="block border border-dashed border-slate-400 rounded-lg px-2 py-3 text-[11px] font-semibold text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
            {uploadingId === uploadKey ? 'Uploading…' : '+ Image (optional)'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleColumnImageUpload(blockId, side, file)
              }}
            />
          </label>
        )}
        <input
          placeholder="Heading"
          value={item.heading || ''}
          onChange={(e) => updateColumn(blockId, side, { heading: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
        />
        <textarea
          placeholder="Text"
          value={item.text || ''}
          onChange={(e) => updateColumn(blockId, side, { text: e.target.value })}
          rows={2}
          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
        />
        <input
          placeholder="Button text"
          value={item.buttonText || ''}
          onChange={(e) => updateColumn(blockId, side, { buttonText: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
        />
        <input
          placeholder="Button link"
          value={item.buttonLink || ''}
          onChange={(e) => updateColumn(blockId, side, { buttonLink: e.target.value })}
          className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr_340px]">
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2 h-fit">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mb-1">Add block</p>
        {(Object.keys(BLOCK_META) as Block['type'][]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="w-full flex items-center gap-2.5 text-left text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2.5 hover:border-orange-400 hover:bg-orange-50 transition"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: BLOCK_META[type].accent }}
            >
              {BLOCK_META[type].icon}
            </span>
            {BLOCK_META[type].label}
          </button>
        ))}
        <p className="text-[11px] text-slate-400 leading-relaxed pt-2 px-1">
          Use <b>{'{{first_name}}'}</b> or <b>{'{{last_name}}'}</b> in any Heading or Text to personalize per
          contact.
        </p>
      </div>

      <div className="space-y-3">
        {blocks.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center text-sm text-slate-400">
            Add your first block from the left to start building the email.
          </div>
        )}

        {blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDraggedId(block.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(block.id)}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-move"
            style={{ borderLeftWidth: 4, borderLeftColor: BLOCK_META[block.type].accent }}
          >
            <div className="flex items-center justify-between px-3 pt-3 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <span className="opacity-40">⠿</span> {BLOCK_META[block.type].label}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, -1)}
                  disabled={index === 0}
                  className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(block.id, 1)}
                  disabled={index === blocks.length - 1}
                  className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="px-3 pb-3">
              {(block.type === 'heading' || block.type === 'paragraph') && (
                <div>
                  <textarea
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value } as any)}
                    rows={block.type === 'heading' ? 1 : 4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => insertToken(block.id, '{{first_name}}')}
                      className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                    >
                      + First name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertToken(block.id, '{{last_name}}')}
                      className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                    >
                      + Last name
                    </button>
                  </div>
                </div>
              )}

              {block.type === 'image' && (
                <div className="space-y-2">
                  {block.src ? (
                    <div>
                      <img src={block.src} alt={block.alt} className="max-h-40 rounded-lg border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { src: '' } as any)}
                        className="text-xs text-red-600 font-semibold mt-1 block"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <label className="block border border-dashed border-slate-400 rounded-lg px-3 py-4 text-xs font-semibold text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
                      {uploadingId === block.id ? 'Uploading…' : 'Drop or click to upload artwork'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(block.id, file)
                        }}
                      />
                    </label>
                  )}
                  <input
                    placeholder="Alt text (for accessibility)"
                    value={block.alt}
                    onChange={(e) => updateBlock(block.id, { alt: e.target.value } as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                  <input
                    placeholder="Link when clicked (optional)"
                    value={block.link}
                    onChange={(e) => updateBlock(block.id, { link: e.target.value } as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              )}

              {block.type === 'video' && (
                <div className="space-y-2">
                  <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-800 leading-relaxed">
                    Video can't actually play inside an email — every client blocks it. This shows a thumbnail
                    with a play button that opens your video's watch page instead.
                  </div>
                  {block.thumbnailSrc ? (
                    <div>
                      <img src={block.thumbnailSrc} className="max-h-40 rounded-lg border border-slate-200" />
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { thumbnailSrc: '' } as any)}
                        className="text-xs text-red-600 font-semibold mt-1 block"
                      >
                        Remove thumbnail
                      </button>
                    </div>
                  ) : (
                    <label className="block border border-dashed border-slate-400 rounded-lg px-3 py-4 text-xs font-semibold text-center cursor-pointer bg-slate-50 hover:bg-slate-100">
                      {uploadingId === block.id ? 'Processing…' : 'Upload a video thumbnail image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleVideoThumbnailUpload(block.id, file)
                        }}
                      />
                    </label>
                  )}
                  <input
                    placeholder="Watch page link (from the Video tab, e.g. https://www.reachnetworkrec.com/watch/xxxxx)"
                    value={block.videoUrl}
                    onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value } as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              )}

              {block.type === 'button' && (
                <div className="space-y-2">
                  <input
                    placeholder="Button text"
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value } as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Link (https://...)"
                    value={block.link}
                    onChange={(e) => updateBlock(block.id, { link: e.target.value } as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              {block.type === 'spacer' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Height:</span>
                  <input
                    type="number"
                    value={block.height}
                    onChange={(e) => updateBlock(block.id, { height: Number(e.target.value) } as any)}
                    className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-slate-500">px</span>
                </div>
              )}

              {block.type === 'columns' && (
                <div className="grid grid-cols-2 gap-3">
                  <ColumnEditor blockId={block.id} side="left" item={block.left} />
                  <ColumnEditor blockId={block.id} side="right" item={block.right} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-100 rounded-xl border border-slate-200 p-3 h-fit lg:sticky lg:top-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide px-1 mb-2">Live preview</p>
        <div className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-800 px-3 py-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <span className="h-2 w-2 rounded-full bg-green-400" />
          </div>
          <iframe
            srcDoc={previewHtml}
            title="Email preview"
            className="w-full"
            style={{ height: 560, border: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}