'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'
import LoginModal from '@/components/modals/LoginModal'
import RegisterModal from '@/components/modals/RegisterModal'

export default function Navbar() {
  const router = useRouter()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); loadProfile(session.user.id) }
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(id: string) {
    const { data } = await sb.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
  }

  async function doLogout() {
    await sb.auth.signOut()
    setUser(null); setProfile(null); setMenuOpen(false)
    router.push('/')
  }

  function openSettings() { setMenuOpen(false); router.push('/settings') }

  function goDash() {
    const role = profile?.role || user?.user_metadata?.role
    router.push(role === 'professional' ? '/prodash' : '/dashboard')
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const name = profile?.full_name || user?.email?.split('@')[0] || ''
  const firstName = name.split(' ')[0]

  return (
    <>
      <nav style={{
        background: '#fff', borderBottom: '1px solid var(--gray-m)',
        padding: isMobile ? '0 1rem' : '0 2rem',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: isMobile ? '54px' : '64px',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        {/* Logo */}
        <div onClick={() => router.push('/')} style={{
          fontSize: isMobile ? '18px' : '22px', fontWeight: 800, color: 'var(--teal)',
          cursor: 'pointer', letterSpacing: '-1px',
          display: 'flex', alignItems: 'center', gap: '2px',
        }}>
          kydo<span style={{ color: 'var(--amber)' }}>.</span>
          <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--gray)', letterSpacing: '.5px', marginLeft: '3px', alignSelf: 'flex-end', marginBottom: '3px' }}>care</span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Desktop only links */}
          {!isMobile && (
            <>
              <span onClick={() => router.push('/search')} style={{ fontSize: '14px', color: 'var(--text)', cursor: 'pointer', padding: '8px 12px', borderRadius: '24px', fontWeight: 500 }}>
                Αναζήτηση
              </span>
              {user && (
                <span onClick={goDash} style={{ fontSize: '14px', color: 'var(--text)', cursor: 'pointer', padding: '8px 12px', borderRadius: '24px', fontWeight: 500 }}>
                  Πίνακας
                </span>
              )}
            </>
          )}

          {!user ? (
            <>
              {/* Mobile: μόνο Σύνδεση */}
              {isMobile ? (
                <button className="btn btn-o" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setShowLogin(true)}>Σύνδεση</button>
              ) : (
                <>
                  <button className="btn btn-o" onClick={() => setShowLogin(true)}>Σύνδεση</button>
                  <button className="btn btn-p" onClick={() => setShowRegister(true)}>Εγγραφή</button>
                </>
              )}
            </>
          ) : (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <div onClick={() => setMenuOpen(o => !o)} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 8px 6px 12px',
                border: '1px solid var(--gray-m)', borderRadius: '24px',
                cursor: 'pointer', background: '#fff', userSelect: 'none',
              }}>
                {!isMobile && <span style={{ fontSize: '13px', fontWeight: 600 }}>{firstName}</span>}
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                {!isMobile && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </div>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: '#fff', borderRadius: 'var(--r)',
                  minWidth: '240px', boxShadow: '0 4px 24px rgba(0,0,0,.15)',
                  zIndex: 300, overflow: 'hidden',
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-m)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <div onClick={openSettings} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', fontSize: '14px', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Ρυθμίσεις
                  </div>
                  <div style={{ height: '1px', background: 'var(--gray-m)' }} />
                  <div onClick={doLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', fontSize: '14px', cursor: 'pointer', color: 'var(--red)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Έξοδος
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true) }} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true) }} />}
    </>
  )
}