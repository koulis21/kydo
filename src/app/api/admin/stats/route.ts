import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminUser, sbAdmin } from '@/lib/adminCheck'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [
      { count: totalUsers },
      { count: totalFamilies },
      { count: totalPros },
      { count: pendingVerifications },
      { count: activeSubscriptions },
    ] = await Promise.all([
      sbAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      sbAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'family'),
      sbAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professional'),
      sbAdmin.from('professionals').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      sbAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    return NextResponse.json({ totalUsers, totalFamilies, totalPros, pendingVerifications, activeSubscriptions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
