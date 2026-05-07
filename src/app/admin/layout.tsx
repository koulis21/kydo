'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const sb = createClient()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const { data: profile } = await sb.from('profiles').select('admin_role').eq('id', session.user.id).single()
      if (!profile?.admin_role) { router.push('/'); return }
      setChecking(false)
    })
  }, [])

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ color: '#64748b' }}>Φόρτωση...</div>
    </div>
  )

  const links = [
    { href: '/admin', label: '📊 Dashboard', exact: true },
    { href: '/admin/users', label: '👥 Users' },
    { href: '/admin/pros', label: '🩺 Επαγγελματίες' },
    { href: '/admin/verifications', label: '🔍 Επαλήθευση' },
    { href: '/admin/subscriptions', label: '💳 Συνδρομές' },
    { href: '/admin/team', label: '🛡️ Ομάδα' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ width: '220px', background: '#0f172a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '1.2rem 1.2rem 1rem', borderBottom: '1px solid #1e293b' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>
            kydo<span style={{ color: '#0d9488' }}>.admin</span>
          </div>
        </div>
        <nav style={{ padding: '0.8rem 0', flex: 1 }}>
          {links.map(link => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} style={{
                display: 'block',
                padding: '10px 1.2rem',
                color: active ? '#0d9488' : '#94a3b8',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: active ? 700 : 400,
                background: active ? '#1e293b' : 'transparent',
                borderRight: active ? '3px solid #0d9488' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid #1e293b' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#475569', textDecoration: 'none' }}>← Πίσω στο site</Link>
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}
