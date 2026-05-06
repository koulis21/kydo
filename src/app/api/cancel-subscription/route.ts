import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Toggle cancel_at_period_end on the user's active subscription.
// { reactivate: true } flips it back to false (resume autorenewal).
export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const { reactivate } = await req.json().catch(() => ({})) as { reactivate?: boolean }

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await sbAdmin
    .from('subscriptions')
    .select('stripe_subscription_id, status, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()

  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    cancel_at_period_end: !reactivate,
  })

  // Webhook (customer.subscription.updated) will sync the change. Update locally
  // too so the UI reflects the new state immediately without waiting for the
  // webhook round-trip.
  await sbAdmin
    .from('subscriptions')
    .update({ cancel_at_period_end: !reactivate, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.stripe_subscription_id)

  return NextResponse.json({ ok: true, cancel_at_period_end: !reactivate })
}
