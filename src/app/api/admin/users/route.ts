import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminUser, sbAdmin } from '@/lib/adminCheck'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 25
    const offset = (page - 1) * limit

    let query = sbAdmin
      .from('profiles')
      .select('id, full_name, role, admin_role, created_at, city', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) query = query.ilike('full_name', `%${search}%`)
    if (role) query = query.eq('role', role)

    const { data: profiles, count } = await query

    // Fetch emails from auth.users
    const { data: { users: authUsers } } = await sbAdmin.auth.admin.listUsers({ perPage: 1000 })
    const emailMap: Record<string, string> = {}
    authUsers.forEach(u => { emailMap[u.id] = u.email || '' })

    const data = profiles?.map(p => ({ ...p, email: emailMap[p.id] || '' }))

    return NextResponse.json({ data, count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (admin.adminRole === 'mod') return NextResponse.json({ error: 'Ανεπαρκή δικαιώματα' }, { status: 403 })

    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const { error } = await sbAdmin.auth.admin.deleteUser(user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { user_id, action } = await req.json()
    if (!user_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    if (action === 'reset_password') {
      const { data: authUser } = await sbAdmin.auth.admin.getUserById(user_id)
      const email = authUser?.user?.email
      if (!email) return NextResponse.json({ error: 'Δεν βρέθηκε email' }, { status: 404 })

      const { error } = await sbAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://kydo.gr'}/auth/reset-password`,
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
