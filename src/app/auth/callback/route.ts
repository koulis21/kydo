import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')
  const errorParam = searchParams.get('error')

  if (errorParam || !code) {
    return NextResponse.redirect(new URL('/?oauth_error=' + (errorParam || 'missing_code'), origin))
  }

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await sb.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    return NextResponse.redirect(new URL('/?oauth_error=exchange_failed', origin))
  }

  const userId = data.user.id
  const meta = data.user.user_metadata || {}

  const { data: existing } = await sb
    .from('profiles')
    .select('role, deleted_at')
    .eq('id', userId)
    .single()

  if (existing?.deleted_at) {
    await sb.auth.signOut()
    return NextResponse.redirect(new URL('/?oauth_error=account_deleted', origin))
  }

  let role: 'family' | 'professional'

  if (existing?.role) {
    // If user explicitly chose 'professional' during registration, update role
    if (roleParam === 'professional' && existing.role !== 'professional') {
      await sb.from('profiles').update({ role: 'professional' }).eq('id', userId)
      role = 'professional'
    } else {
      role = existing.role as 'family' | 'professional'
    }
  } else {
    role = roleParam === 'professional' ? 'professional' : 'family'
    const fullName =
      meta.full_name ||
      meta.name ||
      [meta.given_name, meta.family_name].filter(Boolean).join(' ') ||
      data.user.email?.split('@')[0] ||
      ''

    const { error: insertError } = await sb.from('profiles').insert({
      id: userId,
      full_name: fullName,
      role,
    })
    if (insertError) {
      return NextResponse.redirect(new URL('/?oauth_error=profile_create', origin))
    }

    // Create professionals row for new pro accounts
    if (role === 'professional') {
      await sb.from('professionals').insert({ id: userId })
    }
  }

  return NextResponse.redirect(
    new URL(role === 'professional' ? '/prodash' : '/dashboard', origin)
  )
}
