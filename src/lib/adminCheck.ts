import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getAdminUser(cookieStore: any) {
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  const { data: profile } = await sbAdmin
    .from('profiles')
    .select('admin_role')
    .eq('id', user.id)
    .single()

  if (!profile?.admin_role) return null
  return { user, adminRole: profile.admin_role as 'mod' | 'admin' | 'super_admin' }
}
