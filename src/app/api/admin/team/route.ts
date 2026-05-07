import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminUser, sbAdmin } from '@/lib/adminCheck'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await sbAdmin
      .from('profiles')
      .select('id, full_name, admin_role, created_at')
      .not('admin_role', 'is', null)
      .order('created_at', { ascending: true })

    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Only super_admin can manage roles
    if (admin.adminRole !== 'super_admin') {
      return NextResponse.json({ error: 'Μόνο super_admin μπορεί να αλλάξει roles' }, { status: 403 })
    }

    const { user_id, email, admin_role } = await req.json()
    if (!user_id && !email) return NextResponse.json({ error: 'Missing user_id or email' }, { status: 400 })

    let resolvedId = user_id

    // Resolve email → user_id if email was provided
    if (!resolvedId && email) {
      const { data: { users } } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 })
      const found = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase())
      if (!found) return NextResponse.json({ error: 'Δεν βρέθηκε χρήστης με αυτό το email' }, { status: 404 })
      resolvedId = found.id
    }

    await sbAdmin
      .from('profiles')
      .update({ admin_role: admin_role || null })
      .eq('id', resolvedId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
