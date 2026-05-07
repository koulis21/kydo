import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminUser, sbAdmin } from '@/lib/adminCheck'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const { data: profile } = await sbAdmin
      .from('profiles')
      .select('full_name, city, role, admin_role')
      .eq('id', id)
      .single()

    const { data: authUser } = await sbAdmin.auth.admin.getUserById(id)

    return NextResponse.json({
      profile,
      email: authUser?.user?.email || '',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { full_name, city, admin_role } = await req.json()

    // Only super_admin can change admin_role
    const updateData: Record<string, any> = { full_name, city }
    if (admin_role !== undefined && admin.adminRole === 'super_admin') {
      updateData.admin_role = admin_role || null
    }

    const { error } = await sbAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
