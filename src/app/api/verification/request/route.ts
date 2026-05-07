import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: pro } = await sbAdmin
      .from('professionals')
      .select('*, profiles(full_name)')
      .eq('id', user.id)
      .single()

    if (!pro) return NextResponse.json({ error: 'Δεν βρέθηκε προφίλ επαγγελματία' }, { status: 404 })
    if (pro.verification_status === 'pending') return NextResponse.json({ error: 'Το αίτημα εκκρεμεί ήδη' }, { status: 400 })
    if (pro.verification_status === 'approved') return NextResponse.json({ error: 'Ήδη επαληθευμένος' }, { status: 400 })

    // Minimum requirements
    if (!pro.diploma_path && !pro.cv_path) {
      return NextResponse.json({ error: 'Απαιτείται τουλάχιστον πτυχίο ή βιογραφικό' }, { status: 400 })
    }

    await sbAdmin.from('professionals').update({
      verification_status: 'pending',
      verification_requested_at: new Date().toISOString(),
    }).eq('id', user.id)

    const name = pro.profiles?.full_name || 'Άγνωστος'
    const adminEmail = process.env.ADMIN_EMAIL || 'info@kydo.gr'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kydo.gr'

    await sendEmail({
      to: adminEmail,
      subject: `[Kydo] Αίτημα επαλήθευσης — ${name}`,
      html: `
        <h2>Νέο αίτημα επαλήθευσης επαγγελματία</h2>
        <p><strong>Όνομα:</strong> ${name}</p>
        <p><strong>Κατηγορία:</strong> ${pro.category}</p>
        <p><strong>Αρ. μητρώου:</strong> ${pro.registry_number || '—'}</p>
        <p><strong>Έγγραφα:</strong></p>
        <ul>
          ${pro.diploma_path ? `<li><a href="${pro.diploma_path}">Πτυχίο/Πιστοποιητικό</a></li>` : ''}
          ${pro.cv_path ? `<li><a href="${pro.cv_path}">Βιογραφικό (CV)</a></li>` : ''}
          ${pro.cpr_cert_path ? `<li><a href="${pro.cpr_cert_path}">Α' Βοήθειες/CPR</a></li>` : ''}
        </ul>
        <p>
          <a href="${baseUrl}/admin/verifications" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px">
            Διαχείριση αιτημάτων →
          </a>
        </p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Verification request error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
