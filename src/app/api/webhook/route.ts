import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { tierFromPriceId, type SubscriptionTier } from '@/lib/stripe-config'

export const dynamic = 'force-dynamic'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await markSubscriptionCanceled(event.data.object as Stripe.Subscription)
        break
    }
  } catch (err: any) {
    console.error(`Webhook handler error for ${event.type}:`, err.message)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  // Subscription mode → fetch sub and persist
  if (session.mode === 'subscription' && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(session.subscription as string)
    await syncSubscription(sub)
    return
  }

  // Payment mode (per-unlock) — preserve existing logic
  if (session.payment_status !== 'paid') return
  const { professional_id, family_id, is_guest } = session.metadata || {}
  if (!professional_id) return

  if (family_id && is_guest !== 'true') {
    const { data: existing } = await sbAdmin
      .from('unlocks')
      .select('id')
      .eq('family_id', family_id)
      .eq('professional_id', professional_id)
      .maybeSingle()

    if (!existing) {
      await sbAdmin.from('unlocks').insert({
        family_id,
        professional_id,
        stripe_session_id: session.id,
        amount_cents: session.amount_total,
      })
    }
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id
  if (!userId) {
    console.warn('Subscription missing user_id metadata:', sub.id)
    return
  }

  const item = sub.items.data[0]
  const priceId = item?.price.id
  const tier = (sub.metadata?.tier as SubscriptionTier) || (priceId ? tierFromPriceId(priceId) : null)
  if (!tier) {
    console.warn('Could not determine tier for subscription:', sub.id)
    return
  }

  // In recent Stripe API versions, period fields live on subscription items
  const periodStart = item?.current_period_start
  const periodEnd = item?.current_period_end
  if (!periodStart || !periodEnd) {
    console.warn('Subscription item missing period fields:', sub.id)
    return
  }

  await sbAdmin.from('subscriptions').upsert({
    stripe_subscription_id: sub.id,
    user_id: userId,
    tier,
    status: sub.status,
    stripe_customer_id: sub.customer as string,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' })
}

async function markSubscriptionCanceled(sub: Stripe.Subscription) {
  await sbAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id)
}
