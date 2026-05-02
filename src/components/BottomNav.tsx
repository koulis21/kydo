'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile) return null

  const items = [
    {
      id: 'home',
      label: 'Αρχική',
      href: '/',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: 'search',
      label: 'Αναζήτηση',
      href: '/search',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Πίνακας',
      href: '/dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
  ]

  return (
    <div style={{
      display: 'flex',
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #ddd',
      zIndex: 9999, justifyContent: 'space-around',
      alignItems: 'center', height: '64px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => {
        const active = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              cursor: 'pointer', padding: '8px 16px',
              borderRadius: '12px', flex: 1,
              background: 'none', border: 'none',
              color: active ? 'var(--teal)' : 'var(--gray)',
            }}
          >
            {item.icon}
            <span style={{ fontSize: '10px', fontWeight: 600 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}