import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Returns the family's contact info (name + phone) if the calling pro has
// unlocked this job posting (either by per-€1.99 unlock or active sub).
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await ctx.params

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Look up job + family_id
  const { data: job } = await sbAdmin
    .from('job_postings')
    .select('family_id')
    .eq('id', jobId)
    .single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Has the pro unlocked this job?
  const { data: unlock } = await sbAdmin
    .from('job_unlocks')
    .select('id')
    .eq('job_id', jobId)
    .eq('professional_id', user.id)
    .maybeSingle()

  if (!unlock) {
    return NextResponse.json({ error: 'Not unlocked' }, { status: 403 })
  }

  // Fetch family name + phone
  const [{ data: profile }, { data: phoneRecord }] = await Promise.all([
    sbAdmin.from('profiles').select('full_name').eq('id', job.family_id).single(),
    sbAdmin.from('profile_phones').select('phone').eq('id', job.family_id).single(),
  ])

  return NextResponse.json({
    name: profile?.full_name || null,
    phone: phoneRecord?.phone || null,
  })
}
