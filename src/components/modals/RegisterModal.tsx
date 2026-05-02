'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { isPwValid } from '@/lib/auth'
import Turnstile from 'react-turnstile'

interface Props {
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function RegisterModal({ onClose, onSwitchToLogin }: Props) {
  const sb = createClient()
  const [role, setRole] = useState<'family' | 'pro'>('family')
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [terms, setTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')
  const [loading, setLoading] = useState(false)

  // PW rules
  const pwLen = pass.length >= 8
  const pwUpper = /[A-Z]/.test(pass)
  const pwNum = /[0-9]/.test(pass)
  const pwSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)

  async function doRegister() {
    if (!fname || !lname || !email || !pass) {
      setMsg('Συμπληρώστε όλα τα υποχρεωτικά πεδία.'); setMsgType('error'); return
    }
    if (!terms) {
      setMsg('Αποδεχτείτε τους Όρους Χρήσης.'); setMsgType('error'); return
    }
    if (!captchaToken) {
      setMsg('Παρακαλώ ολοκληρώστε το CAPTCHA.'); setMsgType('error'); return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMsg('Μη έγκυρο email.'); setMsgType('error'); return
    }
    if (phone.length > 0 && phone.length !== 10) {
      setMsg('Το κινητό πρέπει να έχει 10 ψηφία.'); setMsgType('error'); return
    }
    if (!isPwValid(pass)) {
      setMsg('Ο κωδικός δεν πληροί τις απαιτήσεις.'); setMsgType('error'); return
    }
    if (pass !== pass2) {
      setMsg('Οι κωδικοί δεν ταιριάζουν.'); setMsgType('error'); return
    }

    setLoading(true)
    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fname + ' ' + lname,
            role: role === 'pro' ? 'professional' : 'family',
            phone: phone ? '+30' + phone : '',
          }
        }
      })
      if (error) {
        setMsg('Σφάλμα: ' + error.message); setMsgType('error')
        setLoading(false); return
      }
      if (data.user?.identities?.length === 0) {
        setMsg('⚠️ Αυτό το email χρησιμοποιείται ήδη.'); setMsgType('error')
        setLoading(false); return
      }
      setMsg('✓ Ο λογαριασμός δημιουργήθηκε! Ελέγξτε το email σας.')
      setMsgType('success')
      setTimeout(() => onClose(), 3000)
    } catch (e: any) {
      setMsg('Σφάλμα: ' + e.message); setMsgType('error')
      setLoading(false)
    }
  }

  const ruleItem = (ok: boolean, label: string) => (
    <div className={`pw-rule ${ok ? 'ok' : ''}`}>
      <div className="dot" />
      <span>{label}</span>
    </div>
  )

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
          height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer',
        }}>✕</button>

        <div style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Εγγραφή στο Kydo
        </div>

        {/* Role picker */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.2rem' }}>
          {([['family', '👨‍👩‍👧', 'Οικογένεια', 'Αναζητώ επαγγελματία'],
             ['pro', '👩‍⚕️', 'Επαγγελματίας', 'Προσφέρω υπηρεσίες']] as const).map(([r, icon, title, sub]) => (
            <div
              key={r}
              onClick={() => setRole(r)}
              style={{
                border: `2px solid ${role === r ? 'var(--teal)' : 'var(--gray-m)'}`,
                background: role === r ? 'var(--teal-l)' : '#fff',
                borderRadius: 'var(--r)', padding: '1.2rem',
                textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
              <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{title}</h4>
              <p style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '3px' }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Όνομα</label>
            <input type="text" className="form-input" placeholder="Μαρία" value={fname} onChange={e => setFname(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Επώνυμο</label>
            <input type="text" className="form-input" placeholder="Παπαδάκη" value={lname} onChange={e => setLname(e.target.value)} />
          </div>
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>Email</label>
        <input type="email" className="form-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>Κινητό τηλέφωνο</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" value="+30" readOnly style={{
            width: '70px', padding: '12px 10px', border: '1.5px solid var(--gray-m)',
            borderRadius: 'var(--rs)', fontSize: '15px', background: 'var(--gray-l)',
            textAlign: 'center', fontWeight: 600, outline: 'none',
          }} />
          <input
            type="text" className="form-input" placeholder="6912345678"
            maxLength={10} value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>Κωδικός</label>
        <input type="password" className="form-input" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
        <div className="pw-rules">
          {ruleItem(pwLen, '8+ χαρακτήρες')}
          {ruleItem(pwUpper, 'Κεφαλαίο (A-Z)')}
          {ruleItem(pwNum, 'Αριθμός (0-9)')}
          {ruleItem(pwSpecial, 'Ειδικός χαρακτήρας')}
        </div>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>Επιβεβαίωση κωδικού</label>
        <input type="password" className="form-input" placeholder="••••••••" value={pass2} onChange={e => setPass2(e.target.value)} />
        {pass2 && pass !== pass2 && (
          <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '5px' }}>⚠️ Οι κωδικοί δεν ταιριάζουν</div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '14px', fontSize: '13px', color: 'var(--gray)' }}>
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)}
            style={{ marginTop: '2px', accentColor: 'var(--teal)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
          <span>
            Αποδέχομαι τους{' '}
            <a href="/terms" target="_blank" style={{ color: 'var(--teal)', fontWeight: 600 }}>Όρους Χρήσης</a>
            {' '}και την{' '}
            <a href="/privacy" target="_blank" style={{ color: 'var(--teal)', fontWeight: 600 }}>Πολιτική Απορρήτου</a>.
          </span>
        </div>

        <div style={{ marginTop: '14px' }}>
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onVerify={token => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
          />
        </div>

        {msg && (
          <div className={`msg ${msgType === 'error' ? 'msg-error' : 'msg-success'}`}>{msg}</div>
        )}

        <button className="submit-btn" onClick={doRegister} disabled={loading}>
          {loading ? <><div className="spinner" /><span>Δημιουργία...</span></> : <span>Δημιουργία λογαριασμού</span>}
        </button>

        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
          <span style={{ color: 'var(--gray)' }}>Έχετε ήδη λογαριασμό; </span>
          <button onClick={onSwitchToLogin} style={{
            background: 'none', border: 'none', color: 'var(--teal)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, textDecoration: 'underline',
          }}>Συνδεθείτε</button>
        </div>
      </div>
    </div>
  )
}