'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isLocked, remainingLock, recordFail, clearLock, formatTime } from '@/lib/auth'

interface Props {
  onClose: () => void
  onSwitchToRegister: () => void
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

  useEffect(() => {
    if (isLocked()) {
      setMsg('🔒 Κλειδωμένο για ' + formatTime(remainingLock()) + '.')
      setMsgType('error')
    }
  }, [])

  async function doLogin() {
    if (isLocked()) {
      setMsg('🔒 Κλειδωμένο για ' + formatTime(remainingLock()) + '.')
      setMsgType('error')
      return
    }
    if (!email || !pass) {
      setMsg('Συμπληρώστε email και κωδικό.')
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
        const attempts = recordFail()
        const rem = 5 - attempts
        setMsg(attempts >= 5
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
      clearLock()
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