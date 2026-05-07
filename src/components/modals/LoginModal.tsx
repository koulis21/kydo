'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatTime } from '@/lib/auth'
import Turnstile from 'react-turnstile'

interface Props {
  onClose: () => void
  onSwitchToRegister: () => void
}

async function checkLock(email: string): Promise<{ locked: boolean; remaining?: number; attempts?: number }> {
  const res = await fetch('/api/auth-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'check', email }),
  })
  return res.json()
}

async function recordFail(email: string): Promise<{ locked: boolean; attempts: number }> {
  const res = await fetch('/api/auth-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fail', email }),
  })
  return res.json()
}

async function clearLock(email: string) {
  await fetch('/api/auth-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear', email }),
  })
}

export default function LoginModal({ onClose, onSwitchToRegister }: Props) {
  const router = useRouter()
  const sb = createClient()
  const [tab, setTab] = useState<'family' | 'pro'>('family')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')

  // Facebook login disabled until Business Verification is complete
  const FACEBOOK_ENABLED = false

  async function doOAuth(provider: 'google' | 'facebook') {
    setLoading(true)
    setMsg('')
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setMsg('Σφάλμα: ' + error.message)
      setMsgType('error')
      setLoading(false)
    }
    // Σε επιτυχία γίνεται redirect — δεν χρειάζεται κάτι άλλο εδώ.
  }

  async function doLogin() {
    if (!email || !pass) {
      setMsg('Συμπληρώστε email και κωδικό.')
      setMsgType('error')
      return
    }
    if (!captchaToken) {
      setMsg('Παρακαλώ ολοκληρώστε το CAPTCHA.')
      setMsgType('error')
      return
    }

    // Server-side lockout check
    const lockState = await checkLock(email)
    if (lockState.locked) {
      setMsg('🔒 Κλειδωμένο για ' + formatTime(lockState.remaining ?? 0) + '.')
      setMsgType('error')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass })
      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          setMsg('⚠️ Επιβεβαιώστε το email σας πρώτα.')
          setMsgType('error')
          setLoading(false)
          return
        }
        const result = await recordFail(email)
        const rem = 5 - result.attempts
        setMsg(result.locked
          ? '🔒 Κλειδωμένο για 15 λεπτά.'
          : `Λάθος στοιχεία. ${rem} προσπάθεια${rem === 1 ? '' : 'ες'} ακόμα.`
        )
        setMsgType('error')
        setLoading(false)
        return
      }
      const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single()
      const expected = tab === 'pro' ? 'professional' : 'family'
      if (profile && profile.role !== expected) {
        await sb.auth.signOut()
        setMsg('Λάθος tab — επιλέξτε τον σωστό τύπο.')
        setMsgType('error')
        setLoading(false)
        return
      }
      await clearLock(email)
      onClose()
      const role = profile?.role || data.user.user_metadata?.role
      router.push(role === 'professional' ? '/prodash' : '/dashboard')
    } catch (e: any) {
      setMsg('Σφάλμα: ' + e.message)
      setMsgType('error')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        zIndex: 500, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 'var(--r)', padding: '2rem',
        width: 'min(520px,96vw)', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,.18)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'var(--gray-l)', border: 'none', width: '32px',
          height: '32px', borderRadius: '50%', fontSize: '16px',
          cursor: 'pointer',
        }}>✕</button>

        <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Σύνδεση στο Kydo
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${tab === 'family' ? 'active' : ''}`} onClick={() => setTab('family')}>Οικογένεια</div>
          <div className={`tab ${tab === 'pro' ? 'active' : ''}`} onClick={() => setTab('pro')}>Επαγγελματίας</div>
        </div>

        {/* OAuth providers */}
        <div style={{ display: 'grid', gap: '10px', marginBottom: '1.2rem' }}>
          <button
            type="button"
            onClick={() => doOAuth('google')}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', borderRadius: 'var(--rs)', border: '1.5px solid var(--gray-m)',
              background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              color: 'var(--text)', transition: 'background .15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.1 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            <span>Συνέχεια με Google</span>
          </button>
          {FACEBOOK_ENABLED && (
          <button
            type="button"
            onClick={() => doOAuth('facebook')}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '12px', borderRadius: 'var(--rs)', border: '1.5px solid #1877F2',
              background: '#1877F2', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              color: '#fff', transition: 'background .15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82V14.706h-3.13v-3.622h3.13V8.413c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.408 0 22.675 0z"/>
            </svg>
            <span>Συνέχεια με Facebook</span>
          </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 1rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-m)' }} />
          <span style={{ fontSize: '12px', color: 'var(--gray)' }}>ή με email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gray-m)' }} />
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email</label>
        <input
          type="email" className="form-input" placeholder="email@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()}
        />

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>Κωδικός</label>
        <input
          type="password" className="form-input" placeholder="••••••••"
          value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doLogin()}
        />

        {msg && (
          <div className={`msg ${msgType === 'error' ? 'msg-error' : 'msg-success'}`}>{msg}</div>
        )}

        <div style={{ marginTop: '14px' }}>
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={token => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
          />
        </div>

        <button className="submit-btn" onClick={doLogin} disabled={loading}>
          {loading ? <><div className="spinner" /><span>Σύνδεση...</span></> : <span>Σύνδεση</span>}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px' }}>
          <span style={{ color: 'var(--gray)' }}>Δεν έχετε λογαριασμό;</span>
          <button
            onClick={onSwitchToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textDecoration: 'underline' }}
          >
            Εγγραφείτε
          </button>
        </div>
      </div>
    </div>
  )
}
