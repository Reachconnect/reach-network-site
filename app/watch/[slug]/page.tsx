import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

type Video = {
  slug: string
  video_url: string
  thumbnail_url: string | null
  name: string | null
  title: string | null
  phone: string | null
  email: string | null
  video_type: string | null
}

async function getVideo(slug: string): Promise<Video | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recruitment_videos')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const video = await getVideo(slug)

  if (!video) {
    return { title: 'Video not found — Reach Network Recruitment' }
  }

  const title = video.name
    ? `${video.video_type || "We're recruiting"} — ${video.name}, Reach Network Recruitment`
    : 'Reach Network Recruitment'

  const description = 'Watch this update from Reach Network Recruitment.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
    },
  }
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const video = await getVideo(slug)

  if (!video) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Video not found</h1>
          <p className="mt-2 text-slate-500">This link may have expired or been removed.</p>
          <Link
            href="https://www.reachnetworkrec.com"
            className="mt-6 inline-block rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600"
          >
            Visit reachnetworkrec.com
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0F2438] flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
            {video.video_type || "We're recruiting"}
          </p>
          <h1 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
            Reach Network Recruitment
          </h1>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            src={video.video_url}
            poster={video.thumbnail_url || undefined}
            controls
            playsInline
            className="w-full block"
          />
        </div>

        {(video.name || video.phone || video.email) && (
          <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
            {video.name && <p className="text-lg font-bold text-white">{video.name}</p>}
            {video.title && <p className="text-sm text-white/60">{video.title}</p>}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/80">
              {video.phone && <span>{video.phone}</span>}
              {video.email && <span>{video.email}</span>}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="https://www.reachnetworkrec.com"
            className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Visit reachnetworkrec.com
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  )
}