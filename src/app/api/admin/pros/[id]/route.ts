import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminUser, sbAdmin } from '@/lib/adminCheck'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const admin = await getAdminUser(cookieStore)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const { data: pro, error } = await sbAdmin
      .from('professionals')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const { data: profile } = await sbAdmin
      .from('profiles')
      .select('full_name, city, area')
      .eq('id', id)
      .single()

    const { data: phoneRow } = await sbAdmin
      .from('profile_phones')
      .select('phone')
      .eq('id', id)
      .maybeSingle()

    return NextResponse.json({ pro, profile, phone: phoneRow?.phone || '' })
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
    const body = await req.json()

    const {
      full_name, city, phone,
      gender,
      category, experience_years, hourly_rate, registry_number,
      area, max_distance, bio, is_verified, verification_status, is_express,
    } = body

    // Update profiles
    await sbAdmin
      .from('profiles')
      .update({ full_name, city })
      .eq('id', id)

    // Update phone
    if (phone !== undefined) {
      const formatted = phone ? (phone.startsWith('+30') ? phone : '+30' + phone) : null
      await sbAdmin
        .from('profile_phones')
        .upsert({ id, phone: formatted }, { onConflict: 'id' })
    }

    // Update professionals
    const { error } = await sbAdmin
      .from('professionals')
      .update({
        gender: gender || null,
        category,
        experience_years: experience_years ? parseInt(experience_years) : null,
        hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
        registry_number,
        area,
        max_distance: max_distance ? parseInt(max_distance) : 10,
        bio,
        is_verified: Boolean(is_verified),
        verification_status,
        is_express: Boolean(is_express),
      })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
