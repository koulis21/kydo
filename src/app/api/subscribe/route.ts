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

  // Audience check: families can't buy pro tiers, pros can't buy family tiers
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('role, stripe_customer_id')
    .eq('id', user.id)
    .single()

  const requiredRole = TIERS[tier].audience === 'family' ? 'family' : 'professional'
  if (profile?.role !== requiredRole) {
    return NextResponse.json({ error: 'Wrong audience for this tier' }, { status: 403 })
  }

  // Reuse Stripe customer if user already has one
  let customerId = profile?.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await sbAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.get('host')}`

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: getPriceId(tier), quantity: 1 }],
    metadata: { user_id: user.id, tier },
    subscription_data: { metadata: { user_id: user.id, tier } },
    success_url: `${baseUrl}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/upgrade?canceled=1`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
