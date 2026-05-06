import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserClient() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// Create a new job posting (family role only).
export async function POST(req: NextRequest) {
  const { sb, user } = await getUserClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    title: string
    description: string
    category: string
    patient_info?: string
    area: string
    lat?: number
    lng?: number
    schedule_days?: string[]
    schedule_hours?: string
    pay_per_hour?: number
    is_urgent?: boolean
  }

  if (!body.title?.trim() || !body.description?.trim() || !body.category || !body.area) {
    return NextResponse.json({ error: 'Λείπουν υποχρεωτικά πεδία' }, { status: 400 })
  }

  // Audience guard
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'family') {
    return NextResponse.json({ error: 'Μόνο οικογένειες δημοσιεύουν αγγελίες' }, { status: 403 })
  }

  const { data, error } = await sb.from('job_postings').insert({
    family_id: user.id,
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category,
    patient_info: body.patient_info?.trim() || null,
    area: body.area,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    schedule_days: body.schedule_days || [],
    schedule_hours: body.schedule_hours || null,
    pay_per_hour: body.pay_per_hour ?? null,
    is_urgent: !!body.is_urgent,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}

// List open job postings (visible to all authenticated users via RLS).
export async function GET() {
  const { sb, user } = await getUserClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await sb.from('job_postings')
    .select('id, title, description, category, patient_info, area, schedule_days, schedule_hours, pay_per_hour, is_urgent, status, created_at')
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data || [] })
}
