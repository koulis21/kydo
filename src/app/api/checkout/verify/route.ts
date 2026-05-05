import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  // Επαλήθευσε με Stripe ότι η πληρωμή έγινε
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(session_id)
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Not paid' }, { status: 402 })
  }

  const { professional_id } = session.metadata || {}
  if (!professional_id) return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })

  // Επέστρεψε phone
  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('phone')
    .eq('id', professional_id)
    .single()

  return NextResponse.json({ phone: profile?.phone || null, professional_id })
}
