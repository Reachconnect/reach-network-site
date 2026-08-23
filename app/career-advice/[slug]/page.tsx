import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '../../components/Footer'

export const dynamic = 'force-dynamic'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    notFound()
  }

  return (
    <main className="overflow-x-hidden font-body">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-orange">
              <span className="h-3 w-3 rounded-full bg-orange" />
            </span>
            <span className="font-display leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-white">REACH</span>
              <span className="block text-[9px] font-semibold tracking-[0.2em] text-white/60">NETWORK RECRUITMENT</span>
            </span>
          </Link>
          <Link href="/book-a-call" className="rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-dark">
            Let&rsquo;s Talk
          </Link>
        </div>
      </header>

      <section className="bg-navy py-10">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>&#8250;</span>
            <Link href="/career-advice" className="hover:text-white">Career advice</Link>
            <span>&#8250;</span>
            <span>{post.title}</span>
          </p>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-orange">{post.category}</p>
          <h1 className="font-display mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{post.title}</h1>
          <p className="mt-3 text-xs text-white/50">
            {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {post.cover_image_url && (
        <div className="mx-auto -mt-6 max-w-4xl px-6 lg:px-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-lg">
            <Image src={post.cover_image_url} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" />
          </div>
        </div>
      )}

      <section className="bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {post.content}
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-center">
            <p className="font-display text-sm font-bold text-navy">Looking for your next role?</p>
            <p className="mt-1 text-xs text-slate-500">Browse our live job listings or get in touch with our team.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/looking-for-work" className="rounded-full bg-orange px-5 py-2.5 text-xs font-bold text-white transition hover:bg-orange-dark">
                View live jobs
              </Link>
              <Link href="/career-advice" className="rounded-full border border-slate-200 px-5 py-2.5 text-xs font-bold text-navy transition hover:border-slate-300">
                More career advice
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}