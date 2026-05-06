import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserClient() {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function POST(req: NextRequest) {
  const { sb, user } = await getUserClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { professional_id } = await req.json() as { professional_id: string }
  if (!professional_id) return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })

  const { error } = await sb.from('favorites').upsert(
    { user_id: user.id, professional_id },
    { onConflict: 'user_id,professional_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { sb, user } = await getUserClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const professional_id = req.nextUrl.searchParams.get('professional_id')
  if (!professional_id) return NextResponse.json({ error: 'Missing professional_id' }, { status: 400 })

  const { error } = await sb.from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('professional_id', professional_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
