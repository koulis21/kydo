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

    const { user_id, admin_role } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    await sbAdmin
      .from('profiles')
      .update({ admin_role: admin_role || null })
      .eq('id', user_id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
