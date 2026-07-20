import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public health probe. Pings Supabase with a trivial query so external
// uptime monitors (UptimeRobot, Better Uptime) keep both Vercel AND
// Supabase awake by hitting a single URL.
export const dynamic = 'force-dynamic'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const started = Date.now()
  try {
    const { error } = await sbAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      supabase: 'reachable',
      elapsed_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      supabase: 'unreachable',
      error: err.message,
      elapsed_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
