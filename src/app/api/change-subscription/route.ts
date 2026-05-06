import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { TIERS, getPriceId, type SubscriptionTier } from '@/lib/stripe-config'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const { tier } = await req.json() as { tier: SubscriptionTier }
  if (!tier || !TIERS[tier]) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

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
    .select('stripe_subscription_id, tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('current_period_end', new Date().toISOString())
    .maybeSingle()

  if (!sub) return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
  if (sub.tier === tier) return NextResponse.json({ error: 'Already on this tier' }, { status: 400 })

  // Audience guard: family can't switch into pro tier and vice-versa
  if (TIERS[sub.tier as SubscriptionTier].audience !== TIERS[tier].audience) {
    return NextResponse.json({ error: 'Cannot switch between family and pro tiers' }, { status: 403 })
  }

  // Update the subscription's price item — Stripe handles proration automatically
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
  const itemId = stripeSub.items.data[0]?.id
  if (!itemId) return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    items: [{ id: itemId, price: getPriceId(tier) }],
    proration_behavior: 'create_prorations',
    metadata: { user_id: user.id, tier },
  })

  // Webhook will sync the change; update locally for instant UI feedback
  await sbAdmin
    .from('subscriptions')
    .update({ tier, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.stripe_subscription_id)

  return NextResponse.json({ ok: true, tier })
}
