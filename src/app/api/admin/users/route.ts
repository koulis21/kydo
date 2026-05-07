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

    const { data, count } = await query
    return NextResponse.json({ data, count })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
