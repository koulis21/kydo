import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await sb.auth.getUser()
  const path = request.nextUrl.pathname

  // Αν δεν είναι logged in, πήγαινε homepage
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Έλεγξε role από profiles για σωστό redirect
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role

  // Family → μόνο /dashboard
  if (path.startsWith('/prodash') && role !== 'professional') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Professional → μόνο /prodash
  if (path.startsWith('/dashboard') && role !== 'family') {
    return NextResponse.redirect(new URL('/prodash', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/prodash/:path*'],
}
