'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const ADMIN_ROLES = [
  { value: '', label: '— Κανένας —' },
  { value: 'mod', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default function AdminUserEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [role, setRole] = useState('')
  const [adminRole, setAdminRole] = useState('')

  useEffect(() => {
    // Check own admin role
    fetch('/api/admin/users?' + new URLSearchParams({ role: '' }))
      .then(r => r.json())
      .then(d => {
        // we'll detect super_admin from the edit page response
      })

    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(({ profile, email: em }) => {
        setEmail(em || '')
        setFullName(profile?.full_name || '')
        setCity(profile?.city || '')
        setRole(profile?.role || '')
        setAdminRole(profile?.admin_role || '')
        setLoading(false)
      })

    // Check if current user is super_admin
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(d => {
        // We'll rely on the API to enforce - just show the field always
        setIsSuperAdmin(true)
      })
  }, [id])

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, city, admin_role: adminRole }),
    })
    const json = await res.json()
    if (json.ok) {
      setMsg('✓ Αποθηκεύτηκε!')
      setMsgType('success')
    } else {
      setMsg('Σφάλμα: ' + json.error)
      setMsgType('error')
    }
    setSaving(false)
  }

  const field = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{label}</label>
      {input}
    </div>
  )

  const inp = (value: string, setter: (v: string) => void, placeholder = '', disabled = false) => (
    <input
      value={value}
      onChange={e => setter(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
        borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
        background: disabled ? '#f8fafc' : '#fff', color: disabled ? '#94a3b8' : '#0f172a',
      }}
    />
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      Φόρτωση...
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '560px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
        <button
          onClick={() => router.push('/admin/users')}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
        >
          ← Πίσω
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Επεξεργασία χρήστη
        </h1>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.8rem 1.2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          👤 Στοιχεία λογαριασμού
        </div>
        <div style={{ padding: '1.2rem' }}>
          {field('Email', inp(email, () => {}, '', true))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {field('Ονοματεπώνυμο', inp(fullName, setFullName, 'Π.χ. Γιώργος Παπαδόπουλος'))}
            {field('Πόλη', inp(city, setCity, 'Π.χ. Αθήνα'))}
          </div>
          {field('Τύπος λογαριασμού', (
            <input
              value={role === 'professional' ? 'Επαγγελματίας' : 'Οικογένεια'}
              disabled
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', background: '#f8fafc', color: '#94a3b8' }}
            />
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.8rem 1.2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          🛡️ Admin δικαιώματα
        </div>
        <div style={{ padding: '1.2rem' }}>
          {field('Ρόλος admin', (
            <select
              value={adminRole}
              onChange={e => setAdminRole(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
            >
              {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          ))}
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            Μόνο super_admin μπορεί να αλλάξει admin ρόλους.
          </p>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '1rem',
          background: msgType === 'success' ? '#dcfce7' : '#fee2e2',
          color: msgType === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${msgType === 'success' ? '#bbf7d0' : '#fca5a5'}`,
        }}>{msg}</div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ padding: '12px 28px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          {saving ? 'Αποθήκευση...' : '💾 Αποθήκευση'}
        </button>
        <button
          onClick={() => router.push('/admin/users')}
          style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Ακύρωση
        </button>
      </div>
    </div>
  )
}
