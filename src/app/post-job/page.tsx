'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PlacesInput from '@/components/PlacesInput'
import { JOB_CATEGORIES } from '@/lib/jobs'

const DAYS = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ']

export default function PostJobPage() {
  const router = useRouter()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [patientInfo, setPatientInfo] = useState('')
  const [area, setArea] = useState('')
  const [areaLat, setAreaLat] = useState<number | null>(null)
  const [areaLng, setAreaLng] = useState<number | null>(null)
  const [scheduleDays, setScheduleDays] = useState<string[]>([])
  const [scheduleHours, setScheduleHours] = useState('')
  const [payPerHour, setPayPerHour] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/?login=1&redirect=/post-job'); return }
      setUser(session.user)
      const { data: profile } = await sb.from('profiles').select('role,area').eq('id', session.user.id).single()
      if (profile?.role !== 'family') { router.push('/'); return }
      if (profile?.area) setArea(profile.area)
    })
  }, [])

  function toggleDay(d: string) {
    setScheduleDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function submit() {
    setMsg('')
    if (!title.trim() || title.length < 5) { setMsg('Δώστε σύντομο τίτλο (τουλάχιστον 5 χαρ.)'); setMsgType('error'); return }
    if (!description.trim() || description.length < 30) { setMsg('Περιγράψτε με τουλάχιστον 30 χαρακτήρες'); setMsgType('error'); return }
    if (!category) { setMsg('Επιλέξτε κατηγορία επαγγελματία'); setMsgType('error'); return }
    if (!area) { setMsg('Επιλέξτε περιοχή'); setMsgType('error'); return }

    setBusy(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          patient_info: patientInfo.trim(),
          area,
          lat: areaLat,
          lng: areaLng,
          schedule_days: scheduleDays,
          schedule_hours: scheduleHours,
          pay_per_hour: payPerHour ? parseFloat(payPerHour) : null,
          is_urgent: isUrgent,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'unknown')
      router.push('/dashboard')
    } catch (err: any) {
      setMsg('Σφάλμα: ' + err.message)
      setMsgType('error')
      setBusy(false)
    }
  }

  if (!user) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>

  const block = (title: string, children: React.ReactNode) => (
    <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray)', marginBottom: '1.2rem', paddingBottom: '.7rem', borderBottom: '1px solid var(--gray-m)' }}>{title}</div>
      {children}
    </div>
  )

  const field = (label: string, req = false) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', marginTop: '14px' }}>
      {label} {req && <span style={{ color: 'var(--red)' }}>✱</span>}
    </label>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.4rem', letterSpacing: '-.5px' }}>📋 Δημιουργία αγγελίας</h1>
      <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '1.5rem' }}>
        Επαγγελματίες θα βλέπουν την αγγελία σου και θα ξεκλειδώνουν τα στοιχεία επικοινωνίας σου με €1.99 ώστε να σε βρουν.
      </div>

      {block('📝 Βασικές πληροφορίες', <>
        {field('Τίτλος αγγελίας', true)}
        <input className="form-input" placeholder="π.χ. Αποκλειστική νοσηλεύτρια για ηλικιωμένη με Alzheimer" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />

        {field('Κατηγορία επαγγελματία', true)}
        <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Επιλέξτε...</option>
          {JOB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        {field('Πληροφορίες ασθενούς')}
        <input className="form-input" placeholder="π.χ. Άνδρας 78 ετών, ήπιο Parkinson, καθηλωμένος" value={patientInfo} onChange={e => setPatientInfo(e.target.value)} maxLength={200} />

        {field('Αναλυτική περιγραφή', true)}
        <textarea
          className="form-input"
          rows={5}
          placeholder="Περιγράψτε τι ακριβώς χρειάζεστε — καθήκοντα, δυσκολίες, εμπειρία επαγγελματία, οτιδήποτε σχετικό..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={1500}
          style={{ resize: 'vertical' }}
        />
        <div style={{ fontSize: '11px', color: description.length >= 30 ? 'var(--teal)' : 'var(--gray)', marginTop: '4px' }}>
          {description.length}/30 χαρακτήρες {description.length >= 30 && '✓'}
        </div>
      </>)}

      {block('📍 Τοποθεσία', <>
        {field('Περιοχή', true)}
        <PlacesInput
          value={area}
          onChange={setArea}
          onPlaceSelect={(lat, lng, address) => { setArea(address); setAreaLat(lat); setAreaLng(lng) }}
        />
      </>)}

      {block('🗓 Πρόγραμμα & αμοιβή', <>
        {field('Ημέρες')}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {DAYS.map(d => (
            <div key={d} onClick={() => toggleDay(d)} style={{
              width: '38px', height: '34px', borderRadius: '10px', fontSize: '12px',
              border: `1.5px solid ${scheduleDays.includes(d) ? 'var(--teal)' : 'var(--gray-m)'}`,
              background: scheduleDays.includes(d) ? 'var(--teal)' : '#fff',
              color: scheduleDays.includes(d) ? '#fff' : 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, cursor: 'pointer',
            }}>{d}</div>
          ))}
        </div>

        {field('Ωράριο')}
        <input className="form-input" placeholder="π.χ. 08:00 - 20:00 ή 24ωρη παραμονή" value={scheduleHours} onChange={e => setScheduleHours(e.target.value)} />

        {field('Αμοιβή (€/ώρα)')}
        <input className="form-input" type="number" min={0} max={100} step={0.5} placeholder="π.χ. 12" value={payPerHour} onChange={e => setPayPerHour(e.target.value)} />
      </>)}

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--rs)', border: `1.5px solid ${isUrgent ? '#e63946' : 'var(--gray-m)'}`, background: isUrgent ? '#fff5f4' : '#fff', cursor: 'pointer', marginBottom: '1.5rem' }}>
        <input type="checkbox" checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#e63946' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: isUrgent ? '#e63946' : 'var(--text)' }}>🚨 Επείγον</div>
          <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>Η αγγελία θα εμφανιστεί στην κορυφή των αναζητήσεων.</div>
        </div>
      </label>

      {msg && <div className={`msg ${msgType === 'error' ? 'msg-error' : 'msg-success'}`} style={{ marginBottom: '1rem' }}>{msg}</div>}

      <button onClick={submit} disabled={busy} style={{
        width: '100%', padding: '15px',
        background: busy ? 'var(--gray-m)' : 'linear-gradient(135deg,var(--teal),var(--teal2))',
        color: '#fff', border: 'none', borderRadius: 'var(--rs)',
        fontSize: '16px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
      }}>
        {busy ? 'Δημοσίευση...' : '📋 Δημοσίευση αγγελίας'}
      </button>
    </div>
  )
}
