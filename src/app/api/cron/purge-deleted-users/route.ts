import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Find accounts pending deletion for 30+ days
  const { data: profiles, error: fetchError } = await sbAdmin
    .from('profiles')
    .select('id, stripe_customer_id')
    .not('deleted_at', 'is', null)
    .lt('deleted_at', thirtyDaysAgo.toISOString())

  if (fetchError) {
    console.error('[GDPR purge] fetch error:', fetchError.message)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!profiles?.length) {
    console.log('[GDPR purge] No accounts to purge.')
    return NextResponse.json({ purged: 0, total: 0 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let purged = 0
  const errors: string[] = []

  for (const profile of profiles) {
    try {
      // 1. Cancel any active Stripe subscriptions
      if (profile.stripe_customer_id) {
        try {
          const subs = await stripe.subscriptions.list({
            customer: profile.stripe_customer_id,
            status: 'active',
            limit: 10,
          })
          for (const sub of subs.data) {
            await stripe.subscriptions.cancel(sub.id)
          }
        } catch {
          // Stripe customer may not exist — ignore
        }
      }

      // 2. Delete from auth.users (cascades to profiles via FK)
      const { error: deleteError } = await sbAdmin.auth.admin.deleteUser(profile.id)
      if (deleteError) throw new Error(deleteError.message)

      purged++
      console.log(`[GDPR purge] Deleted user ${profile.id}`)
    } catch (e: any) {
      errors.push(`${profile.id}: ${e.message}`)
      console.error(`[GDPR purge] Failed for ${profile.id}:`, e.message)
    }
  }

  return NextResponse.json({
    purged,
    total: profiles.length,
    errors: errors.length ? errors : undefined,
  })
}
