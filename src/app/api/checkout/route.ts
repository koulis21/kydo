import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const { professional_id, professional_name } = await req.json()
  if (!professional_id) return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })

  // Έλεγξε αν είναι logged in
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()

  const isGuest = !user
  const priceInCents = isGuest ? 249 : 199 // €2.49 guest / €1.99 logged in

  const baseUrl = req.headers.get('origin') || `https://${req.headers.get('host')}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    automatic_payment_methods: { enabled: true },
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: priceInCents,
        product_data: {
          name: `Kydo Unlock — ${professional_name || 'Επαγγελματίας'}`,
          description: 'Πρόσβαση σε στοιχεία επικοινωνίας',
        },
      },
      quantity: 1,
    }],
    metadata: {
      professional_id,
      family_id: user?.id || '',
      is_guest: isGuest ? 'true' : 'false',
    },
    success_url: `${baseUrl}/profile?id=${professional_id}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/profile?id=${professional_id}`,
  })

  return NextResponse.json({ url: session.url })
}
