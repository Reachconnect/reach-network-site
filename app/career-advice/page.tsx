import { createClient } from '@/lib/supabase/server'
import CareerAdviceClient from './CareerAdviceClient'

export const dynamic = 'force-dynamic'

export default async function CareerAdvicePage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return <CareerAdviceClient posts={posts || []} />
}