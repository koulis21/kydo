import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Απαιτείται raw body για το Stripe signature verification
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') return NextResponse.json({ ok: true })

    const { professional_id, family_id, is_guest } = session.metadata || {}

    if (!professional_id) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })

    // Για logged-in users: γράψε στο unlocks table
    if (family_id && is_guest !== 'true') {
      // Αποφυγή duplicate unlocks
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

    // Για guests: δεν αποθηκεύουμε — phone επιστρέφεται μέσω /api/checkout/verify
  }

  return NextResponse.json({ received: true })
}
