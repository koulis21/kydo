import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Service role client — bypasses RLS για να διαβάσει phone
const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const professionalId = req.nextUrl.searchParams.get('id')
  if (!professionalId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Έλεγξε session του χρήστη
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Έλεγξε αν υπάρχει unlock για αυτόν τον χρήστη + επαγγελματία
  const { data: unlock } = await sbAdmin
    .from('unlocks')
    .select('id')
    .eq('family_id', user.id)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (!unlock) return NextResponse.json({ error: 'Not unlocked' }, { status: 403 })

  // Επέστρεψε phone μόνο αν υπάρχει unlock (από profile_phones)
  const { data: phoneRecord } = await sbAdmin
    .from('profile_phones')
    .select('phone')
    .eq('id', professionalId)
    .single()

  return NextResponse.json({ phone: phoneRecord?.phone || null })
}
