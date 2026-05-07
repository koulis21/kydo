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

    // Admin check
    const { data: profile } = await sbAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { professional_id, action, notes } = await req.json() as {
      professional_id: string
      action: 'approve' | 'reject'
      notes?: string
    }
    if (!professional_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: pro } = await sbAdmin
      .from('professionals')
      .select('*, profiles(full_name)')
      .eq('id', professional_id)
      .single()

    if (!pro) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const isApproved = action === 'approve'

    await sbAdmin.from('professionals').update({
      verification_status: isApproved ? 'approved' : 'rejected',
      is_verified: isApproved,
      verified_at: isApproved ? new Date().toISOString() : null,
      verification_notes: notes || null,
    }).eq('id', professional_id)

    // Get pro's email
    const { data: authUser } = await sbAdmin.auth.admin.getUserById(professional_id)
    const proEmail = authUser?.user?.email
    if (proEmail) {
      await sendEmail({
        to: proEmail,
        subject: isApproved
          ? '✅ Το προφίλ σας στο Kydo επαληθεύτηκε!'
          : '❌ Αίτημα επαλήθευσης Kydo',
        html: isApproved
          ? `
            <h2>Συγχαρητήρια! Το προφίλ σας επαληθεύτηκε.</h2>
            <p>Το προφίλ σας στο <strong>Kydo</strong> έχει λάβει το badge <strong>✓ Επαληθευμένος</strong>.</p>
            <p>Οι οικογένειες μπορούν πλέον να σας βρουν πιο εύκολα στις αναζητήσεις.</p>
            <p><a href="https://kydo.gr/prodash" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px">Δείτε το προφίλ σας →</a></p>
          `
          : `
            <h2>Το αίτημα επαλήθευσης απορρίφθηκε</h2>
            <p>Δυστυχώς το αίτημα επαλήθευσης του προφίλ σας δεν εγκρίθηκε.</p>
            ${notes ? `<p><strong>Λόγος:</strong> ${notes}</p>` : ''}
            <p>Μπορείτε να ανεβάσετε πρόσθετα έγγραφα και να υποβάλετε νέο αίτημα.</p>
            <p><a href="https://kydo.gr/prodash" style="background:#0d9488;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:10px">Επεξεργασία προφίλ →</a></p>
          `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Admin verify error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
