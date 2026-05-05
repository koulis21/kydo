import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LOCK_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  // Δημιουργία client εδώ (runtime) ώστε να μην σπάσει το build αν λείπει το env var
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { action, email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const key = email.toLowerCase().trim()

  if (action === 'check') {
    const { data } = await sb.from('login_attempts')
      .select('*')
      .eq('email', key)
      .single()

    if (!data) return NextResponse.json({ locked: false, attempts: 0 })

    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 1000)
      return NextResponse.json({ locked: true, remaining })
    }

    // Lockout έληξε — reset
    if (data.locked_until && new Date(data.locked_until) <= new Date()) {
      await sb.from('login_attempts').delete().eq('email', key)
      return NextResponse.json({ locked: false, attempts: 0 })
    }

    return NextResponse.json({ locked: false, attempts: data.attempts || 0 })
  }

  if (action === 'fail') {
    const { data: existing } = await sb.from('login_attempts')
      .select('*')
      .eq('email', key)
      .single()

    const attempts = (existing?.attempts || 0) + 1
    const locked_until = attempts >= LOCK_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString()
      : null

    if (existing) {
      await sb.from('login_attempts').update({ attempts, locked_until }).eq('email', key)
    } else {
      await sb.from('login_attempts').insert({ email: key, attempts, locked_until })
    }

    return NextResponse.json({ locked: !!locked_until, attempts })
  }

  if (action === 'clear') {
    await sb.from('login_attempts').delete().eq('email', key)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
