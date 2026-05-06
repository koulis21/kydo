import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { JOB_UNLOCK_PRICE_CENTS } from '@/lib/jobs'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pro creates a Stripe Checkout Session to unlock a job posting (€1.99).
// Pro with active sub bypasses checkout — unlock is created directly here.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { id: jobId } = await ctx.params

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Audience guard
  const { data: profile } = await sbAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'professional') {
    return NextResponse.json({ error: 'Μόνο επαγγελματίες ξεκλειδώνουν αγγελίες' }, { status: 403 })
  }

  // Validate job exists and is open
  const { data: job } = await sbAdmin
    .from('job_postings')
    .select('id, family_id, status, expires_at')
    .eq('id', jobId)
    .single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open' || new Date(job.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Η αγγελία δεν είναι πλέον ενεργή' }, { status: 410 })
  }

  // Already unlocked?
  const { data: existing } = await sbAdmin
    .from('job_unlocks')
    .select('id')
    .eq('job_id', jobId)
    .eq('professional_id', user.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ ok: true, alreadyUnlocked: true })
  }

  // Active pro subscription bypasses payment — unlock immediately
  const { data: activeSub } = await sbAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .in('tier', ['pro_monthly', 'pro_annual'])
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()

  if (activeSub) {
    await sbAdmin.from('job_unlocks').insert({
      job_id: jobId,
      professional_id: user.id,
      amount_cents: 0,
    })
    return NextResponse.json({ ok: true, viaSubscription: true })
  }

  // Otherwise, create Stripe Checkout Session
  const baseUrl = req.headers.get('origin') || `https://${req.headers.get('host')}`
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: JOB_UNLOCK_PRICE_CENTS,
        product_data: {
          name: 'Kydo — Ξεκλείδωμα αγγελίας',
          description: 'Πρόσβαση σε στοιχεία επικοινωνίας οικογένειας',
        },
      },
      quantity: 1,
    }],
    metadata: {
      kind: 'job_unlock',
      job_id: jobId,
      professional_id: user.id,
    },
    success_url: `${baseUrl}/jobs/${jobId}?paid=1`,
    cancel_url: `${baseUrl}/jobs/${jobId}`,
  })

  return NextResponse.json({ url: session.url })
}
