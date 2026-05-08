'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const CATEGORIES = ['Νοσοκόμα/ος', 'Φυσιοθεραπευτής/ρια', 'Αποκλειστική/ός', 'Βοηθός ζωής', 'Παιδοκόμος', 'Εργοθεραπευτής/ρια', 'Λογοθεραπευτής/ρια', 'Ψυχολόγος']
const STATUSES = ['none', 'pending', 'approved', 'rejected']
const statusLabel: Record<string, string> = { none: 'Καμία', pending: 'Εκκρεμεί', approved: 'Εγκρίθηκε', rejected: 'Απορρίφθηκε' }

export default function AdminProEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

  // Fields
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('')
  const [expYears, setExpYears] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [registryNumber, setRegistryNumber] = useState('')
  const [area, setArea] = useState('')
  const [maxDist, setMaxDist] = useState('10')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState('none')
  const [isExpress, setIsExpress] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
  }, [])

  useEffect(() => {
    fetch(`/api/admin/pros/${id}`)
      .then(r => r.json())
      .then(({ pro, profile, phone: ph }) => {
        setFullName(profile?.full_name || '')
        setCity(profile?.city || '')
        setPhone(ph?.replace('+30', '') || '')
        setCategory(pro?.category || '')
        setExpYears(pro?.experience_years?.toString() || '')
        setHourlyRate(pro?.hourly_rate?.toString() || '')
        setRegistryNumber(pro?.registry_number || '')
        setArea(pro?.area || profile?.area || '')
        setMaxDist(pro?.max_distance?.toString() || '10')
        setBio(pro?.bio || '')
        setGender(pro?.gender || '')
        setIsVerified(pro?.is_verified || false)
        setVerificationStatus(pro?.verification_status || 'none')
        setIsExpress(pro?.is_express || false)
        setLoading(false)
      })
  }, [id])

  async function save() {
    setSaving(true)
    setMsg('')
    const res = await fetch(`/api/admin/pros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName, city, phone,
        gender: gender || null,
        category, experience_years: expYears, hourly_rate: hourlyRate,
        registry_number: registryNumber, area, max_distance: maxDist,
        bio, is_verified: isVerified, verification_status: verificationStatus,
        is_express: isExpress,
      }),
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

  const block = (title: string, children: React.ReactNode) => (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.2rem', overflow: 'hidden' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', padding: '.8rem 1.2rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>{title}</div>
      <div style={{ padding: '1.2rem' }}>{children}</div>
    </div>
  )

  const field = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>{label}</label>
      {input}
    </div>
  )

  const inp = (value: string, setter: (v: string) => void, placeholder = '') => (
    <input
      value={value}
      onChange={e => setter(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
    />
  )

  const toggle = (checked: boolean, setter: (v: boolean) => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div
        onClick={() => setter(!checked)}
        style={{
          width: '42px', height: '24px', borderRadius: '12px',
          background: checked ? '#0d9488' : '#cbd5e1',
          position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </div>
      <span style={{ fontSize: '14px', color: '#334155' }}>{label}</span>
    </label>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
      Φόρτωση...
    </div>
  )

  const allCategories = categories.length > 0
    ? categories.map(c => c.name)
    : CATEGORIES

  return (
    <div style={{ padding: '2rem', maxWidth: '760px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
        <button
          onClick={() => router.push('/admin/pros')}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
        >
          ← Πίσω
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Επεξεργασία επαγγελματία
        </h1>
      </div>

      {block('👤 Στοιχεία λογαριασμού', (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {field('Ονοματεπώνυμο', inp(fullName, setFullName, 'Π.χ. Μαρία Παπαδοπούλου'))}
          {field('Πόλη', inp(city, setCity, 'Π.χ. Αθήνα'))}
          {field('Τηλέφωνο', (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ padding: '9px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '14px', color: '#64748b' }}>+30</span>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="6912345678"
                style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '0 8px 8px 0', fontSize: '14px' }} />
            </div>
          ))}
          {field('Περιοχή / Διεύθυνση', inp(area, setArea, 'Π.χ. Κολωνάκι, Αθήνα'))}
        </div>
      ))}

      {block('🩺 Επαγγελματικά στοιχεία', (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {field('Φύλο', (
            <select value={gender} onChange={e => setGender(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">— Επιλέξτε —</option>
              <option value="male">♂ Άνδρας</option>
              <option value="female">♀ Γυναίκα</option>
              <option value="other">⊕ Άλλο</option>
            </select>
          ))}
          {field('Κατηγορία', (
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">— Επιλέξτε —</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ))}
          {field('Αριθμός μητρώου', inp(registryNumber, setRegistryNumber, 'ΕΦΚΑ / ΕΟΠΠΕΠ'))}
          {field('Χρόνια εμπειρίας', inp(expYears, setExpYears, 'Π.χ. 5'))}
          {field('Ωριαία αμοιβή (€)', inp(hourlyRate, setHourlyRate, 'Π.χ. 12'))}
          {field('Μέγιστη απόσταση (km)', inp(maxDist, setMaxDist, '10'))}
        </div>
      ))}

      {block('📝 Παρουσίαση', (
        field('Bio', (
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Σύντομη παρουσίαση επαγγελματία..."
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
        ))
      ))}

      {block('✅ Επαλήθευση & Κατάσταση', (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {field('Κατάσταση επαλήθευσης', (
            <select value={verificationStatus} onChange={e => setVerificationStatus(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
            </select>
          ))}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {toggle(isVerified, setIsVerified, '🏅 Kydo Verified')}
            {toggle(isExpress, setIsExpress, '⚡ Kydo Express')}
          </div>
        </div>
      ))}

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
          onClick={() => router.push('/admin/pros')}
          style={{ padding: '12px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
        >
          Ακύρωση
        </button>
      </div>
    </div>
  )
}
