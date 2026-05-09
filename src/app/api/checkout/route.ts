import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // Εγγεγραμμένοι χρήστες: 1 δωρεάν unlock
  if (!isGuest) {
    // Αν ο συγκεκριμένος pro είναι ήδη ξεκλειδωμένος, επέστρεψε το phone άμεσα
    const { data: existingUnlock } = await sbAdmin
      .from('unlocks')
      .select('id')
      .eq('family_id', user!.id)
      .eq('professional_id', professional_id)
      .maybeSingle()

    if (existingUnlock) {
      const { data: phoneRecord } = await sbAdmin
        .from('profile_phones').select('phone').eq('id', professional_id).single()
      return NextResponse.json({ free: true, phone: phoneRecord?.phone || null })
    }

    // Μέτρα πόσα unlocks έχει κάνει συνολικά
    const { count } = await sbAdmin
      .from('unlocks')
      .select('id', { count: 'exact', head: true })
      .eq('family_id', user!.id)

    if ((count ?? 0) === 0) {
      // Πρώτο unlock — δωρεάν!
      await sbAdmin.from('unlocks').insert({
        family_id: user!.id,
        professional_id,
        stripe_session_id: 'free_first_unlock',
        amount_cents: 0,
      })
      const { data: phoneRecord } = await sbAdmin
        .from('profile_phones').select('phone').eq('id', professional_id).single()
      return NextResponse.json({ free: true, phone: phoneRecord?.phone || null })
    }
  }

  const priceInCents = isGuest ? 249 : 199 // €2.49 guest / €1.99 logged in

  const baseUrl = req.headers.get('origin') || `https://${req.headers.get('host')}`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: priceInCents,
        product_data: {
          name: `Kydo Επαφή — ${professional_name || 'Επαγγελματίας'}`,
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
