'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isPwValid } from '@/lib/auth'

export default function SettingsPage() {
  const router = useRouter()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [nameMsg, setNameMsg] = useState('')
  const [nameMsgType, setNameMsgType] = useState<'error'|'success'>('error')
  const [passMsg, setPassMsg] = useState('')
  const [passMsgType, setPassMsgType] = useState<'error'|'success'>('error')
  const [deleteInput, setDeleteInput] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState('')

  // PW rules
  const pwLen = pass.length >= 8
  const pwUpper = /[A-Z]/.test(pass)
  const pwNum = /[0-9]/.test(pass)
  const pwSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
      const parts = data?.full_name?.split(' ') || []
      setFname(parts[0] || '')
      setLname(parts.slice(1).join(' ') || '')
    })
  }, [])

  async function doEditName() {
    if (!fname || !lname) { setNameMsg('Συμπληρώστε όνομα και επώνυμο.'); setNameMsgType('error'); return }
    const { error } = await sb.from('profiles').update({ full_name: fname + ' ' + lname }).eq('id', user.id)
    if (error) { setNameMsg('Σφάλμα: ' + error.message); setNameMsgType('error'); return }
    setNameMsg('✓ Αποθηκεύτηκε!'); setNameMsgType('success')
  }

  async function doChangePass() {
    if (!isPwValid(pass)) { setPassMsg('Ο κωδικός δεν πληροί τις απαιτήσεις.'); setPassMsgType('error'); return }
    if (pass !== pass2) { setPassMsg('Οι κωδικοί δεν ταιριάζουν.'); setPassMsgType('error'); return }
    const { error } = await sb.auth.updateUser({ password: pass })
    if (error) { setPassMsg('Σφάλμα: ' + error.message); setPassMsgType('error'); return }
    setPass(''); setPass2('')
    setPassMsg('✓ Ο κωδικός άλλαξε!'); setPassMsgType('success')
  }

  async function doDelete() {
    if (deleteInput !== 'ΔΙΑΓΡΑΦΗ') { setDeleteMsg('Πληκτρολογήστε ΔΙΑΓΡΑΦΗ.'); return }
    const { error } = await sb.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
    if (error) { setDeleteMsg('Σφάλμα: ' + error.message); return }
    await sb.auth.signOut()
    router.push('/')
  }

  const block = (title: string, children: React.ReactNode) => (
    <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', marginBottom: '1rem', overflow: 'hidden' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.9rem 1.3rem', borderBottom: '1px solid var(--gray-m)', background: 'var(--gray-l)' }}>{title}</div>
      <div style={{ padding: '1.2rem 1.3rem' }}>{children}</div>
    </div>
  )

  const ruleItem = (ok: boolean, label: string) => (
    <div className={`pw-rule ${ok ? 'ok' : ''}`}>
      <div className="dot" /><span>{label}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: '620px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-.5px' }}>Ρυθμίσεις λογαριασμού</div>

      {block('👤 Στοιχεία λογαριασμού', <>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Email</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>
          <span>{user?.email}</span>
          <span style={{ fontSize: '11px', color: 'var(--gray)', background: 'var(--gray-l)', padding: '3px 9px', borderRadius: '10px', border: '1px solid var(--gray-m)' }}>🔒 μη επεξεργάσιμο</span>
        </div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Ονοματεπώνυμο</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <input className="form-input" placeholder="Όνομα" value={fname} onChange={e => setFname(e.target.value)} />
          <input className="form-input" placeholder="Επώνυμο" value={lname} onChange={e => setLname(e.target.value)} />
        </div>
        <button onClick={doEditName} style={{ padding: '11px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Αποθήκευση</button>
        {nameMsg && <div className={`msg ${nameMsgType === 'error' ? 'msg-error' : 'msg-success'}`} style={{ marginTop: '8px' }}>{nameMsg}</div>}
      </>)}

      {block('🔑 Αλλαγή κωδικού', <>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: '8px' }}>Νέος κωδικός</label>
        <input type="password" className="form-input" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} />
        <div className="pw-rules" style={{ marginTop: '8px' }}>
          {ruleItem(pwLen, '8+ χαρακτήρες')}
          {ruleItem(pwUpper, 'Κεφαλαίο')}
          {ruleItem(pwNum, 'Αριθμός')}
          {ruleItem(pwSpecial, 'Ειδικός χαρακτήρας')}
        </div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gray)', display: 'block', margin: '12px 0 8px' }}>Επιβεβαίωση νέου κωδικού</label>
        <input type="password" className="form-input" placeholder="••••••••" value={pass2} onChange={e => setPass2(e.target.value)} style={{ marginBottom: '10px' }} />
        <button onClick={doChangePass} style={{ padding: '11px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Αποθήκευση</button>
        {passMsg && <div className={`msg ${passMsgType === 'error' ? 'msg-error' : 'msg-success'}`} style={{ marginTop: '8px' }}>{passMsg}</div>}
      </>)}

      {profile?.role === 'professional' && block('📋 Επαγγελματικό προφίλ', (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', color: 'var(--gray)' }}>Επεξεργασία του προφίλ σας</span>
          <button onClick={() => router.push('/prodash')} style={{ padding: '11px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Επεξεργασία →</button>
        </div>
      ))}

      {/* Danger zone */}
      <div style={{ background: '#fff', border: '1px solid #f5c6c2', borderRadius: 'var(--r)', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.9rem 1.3rem', borderBottom: '1px solid #f5c6c2', background: '#fff8f7' }}>🗑️ Επικίνδυνη ζώνη</div>
        <div style={{ padding: '1.2rem 1.3rem' }}>
          <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '10px', lineHeight: 1.6 }}>Η διαγραφή είναι μόνιμη. Τα δεδομένα σας θα διαγραφούν εντός 30 ημερών.</p>
          <button onClick={() => setShowDelete(v => !v)} style={{ padding: '11px 20px', background: '#fff8f7', color: 'var(--red)', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Διαγραφή λογαριασμού
          </button>
          {showDelete && (
            <div style={{ background: '#fff8f7', border: '1px solid #f5c6c2', borderRadius: 'var(--rs)', padding: '1rem', marginTop: '.8rem' }}>
              <p style={{ fontSize: '13px', color: 'var(--red)', marginBottom: '.8rem', lineHeight: 1.5 }}>⚠️ Πληκτρολογήστε <strong>ΔΙΑΓΡΑΦΗ</strong> για επιβεβαίωση:</p>
              <input className="form-input" placeholder="ΔΙΑΓΡΑΦΗ" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '.8rem' }}>
                <button onClick={doDelete} style={{ padding: '10px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Μόνιμη διαγραφή</button>
                <button onClick={() => setShowDelete(false)} style={{ padding: '10px 18px', background: '#fff', color: 'var(--gray)', border: '1px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '13px', cursor: 'pointer' }}>Ακύρωση</button>
              </div>
              {deleteMsg && <div className="msg msg-error" style={{ marginTop: '8px' }}>{deleteMsg}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}