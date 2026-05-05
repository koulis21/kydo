import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role

  if (path.startsWith('/prodash') && role !== 'professional') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (path.startsWith('/dashboard') && role !== 'family') {
    return NextResponse.redirect(new URL('/prodash', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/prodash/:path*'],
}
