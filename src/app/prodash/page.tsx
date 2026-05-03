'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PlacesInput from '@/components/PlacesInput'

const SPECS = ['Άνοια / Alzheimer', 'Parkinson', 'Παραπληγικοί', 'Μετεγχειρητική', 'Παιδιά με ΑΝ', 'Διαβήτης', 'CPR / Πρώτες βοήθειες', 'Φροντίδα ηλικιωμένων']
const DAYS = ['Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα', 'Κυ']
const TYPES = ['Πλήρης', 'Μερική', 'Διαμονή εντός', 'Νυχτερινή βάρδια', 'Σαββατοκύριακα']
const EXTRAS = ['Αγγλικά', 'Αλβανικά', 'Βουλγαρικά', 'Δίπλωμα οδήγησης', 'Μη καπνίστρια/ης']

export default function ProDashPage() {
  const router = useRouter()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [cat, setCat] = useState('')
  const [exp, setExp] = useState('')
  const [rate, setRate] = useState('')
  const [registry, setRegistry] = useState('')
  const [area, setArea] = useState('')
  const [areaLat, setAreaLat] = useState<number | null>(null)
  const [areaLng, setAreaLng] = useState<number | null>(null)
  const [postalCode, setPostalCode] = useState('')
  const [maxDist, setMaxDist] = useState(10)
  const [selTypes, setSelTypes] = useState<string[]>([])
  const [selDays, setSelDays] = useState<string[]>([])
  const [timeFrom, setTimeFrom] = useState('08:00')
  const [timeTo, setTimeTo] = useState('20:00')
  const [isExpress, setIsExpress] = useState(false)
  const [selSpecs, setSelSpecs] = useState<string[]>([])
  const [selExtras, setSelExtras] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'error' | 'success'>('error')

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      if (profile?.full_name) {
        const parts = profile.full_name.split(' ')
        setFname(parts[0] || '')
        setLname(parts.slice(1).join(' ') || '')
        setPhone(profile.phone?.replace('+30', '') || '')
        setArea(profile.area || '')
      }
      const { data: pro } = await sb.from('professionals').select('*').eq('id', session.user.id).single()
      if (pro) {
        setCat(pro.category || '')
        setExp(pro.experience_years?.toString() || '')
        setRate(pro.hourly_rate?.toString() || '')
        setRegistry(pro.registry_number || '')
        setArea(pro.area || '')
        setAreaLat(pro.lat || null)
        setAreaLng(pro.lng || null)
        setPostalCode(pro.postal_code || '')
        setMaxDist(pro.max_distance || 10)
        setSelTypes(pro.employment_types || [])
        setSelDays(pro.available_days || [])
        setTimeFrom(pro.time_from || '08:00')
        setTimeTo(pro.time_to || '20:00')
        setIsExpress(pro.is_express || false)
        setSelSpecs(pro.specializations || [])
        setSelExtras(pro.extras || [])
        setBio(pro.bio || '')
      }
    })
  }, [])

  function toggleItem(item: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function savePro() {
    if (!fname || !lname) { setMsg('✱ Συμπληρώστε Όνομα και Επώνυμο.'); setMsgType('error'); return }
    if (!phone || phone.length !== 10) { setMsg('✱ Συμπληρώστε έγκυρο κινητό (10 ψηφία).'); setMsgType('error'); return }
    if (!cat) { setMsg('✱ Επιλέξτε κατηγορία.'); setMsgType('error'); return }
    if (!rate || parseFloat(rate) < 7) { setMsg('✱ Συμπληρώστε ωριαία αμοιβή (ελάχιστο €7).'); setMsgType('error'); return }
    if (!area) { setMsg('✱ Συμπληρώστε την περιοχή σας.'); setMsgType('error'); return }

    await sb.from('profiles').update({
      full_name: fname + ' ' + lname,
      phone: '+30' + phone,
      area,
    }).eq('id', user.id)

    const { error } = await sb.from('professionals').upsert({
      id: user.id,
      category: cat,
      specializations: selSpecs,
      experience_years: parseInt(exp) || 0,
      hourly_rate: parseFloat(rate),
      bio,
      area,
      lat: areaLat,
      lng: areaLng,
      postal_code: postalCode,
      max_distance: maxDist,
      employment_types: selTypes,
      available_days: selDays,
      time_from: timeFrom,
      time_to: timeTo,
      registry_number: registry,
      is_express: isExpress,
      extras: selExtras,
    })

    if (error) { setMsg('Σφάλμα: ' + error.message); setMsgType('error') }
    else { setMsg('✓ Το προφίλ αποθηκεύτηκε! Εμφανίζεστε πλέον στην αναζήτηση.'); setMsgType('success') }
  }

  const chip = (label: string, list: string[], setList: (v: string[]) => void, teal = false) => (
    <div key={label} onClick={() => toggleItem(label, list, setList)} style={{
      padding: '8px 16px', borderRadius: '24px', fontSize: '13px', cursor: 'pointer',
      fontWeight: 500, transition: 'all .15s', display: 'inline-block',
      border: `1.5px solid ${list.includes(label) ? (teal ? 'var(--teal)' : 'var(--text)') : 'var(--gray-m)'}`,
      background: list.includes(label) ? (teal ? 'var(--teal)' : 'var(--text)') : '#fff',
      color: list.includes(label) ? '#fff' : 'var(--text)',
    }}>{label}</div>
  )

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-.5px' }}>Προφίλ Επαγγελματία</h1>

      <div style={{ background: 'var(--teal-l)', borderRadius: 'var(--r)', padding: '1.2rem', marginBottom: '1.5rem', fontSize: '14px', color: 'var(--teal)', border: '1px solid #b8e8d8' }}>
        👋 Συμπλήρωσε το προφίλ σου για να εμφανιστείς στην αναζήτηση.
      </div>

      <div style={{ background: 'var(--amber-l)', border: '1px solid #e8c97a', borderRadius: 'var(--rs)', padding: '.9rem 1.2rem', marginBottom: '1rem', fontSize: '13px', color: 'var(--amber)' }}>
        ℹ️ Τα πεδία με <span style={{ color: 'var(--red)', fontWeight: 700 }}>✱</span> είναι <strong>υποχρεωτικά</strong>.
      </div>

      {block('👤 Βασικά στοιχεία', <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>{field('Όνομα', true)}<input className="form-input" placeholder="Μαρία" value={fname} onChange={e => setFname(e.target.value)} /></div>
          <div>{field('Επώνυμο', true)}<input className="form-input" placeholder="Παπαδάκη" value={lname} onChange={e => setLname(e.target.value)} /></div>
        </div>
        {field('Κινητό', true)}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value="+30" readOnly style={{ width: '70px', padding: '12px 10px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '15px', background: 'var(--gray-l)', textAlign: 'center', fontWeight: 600, outline: 'none' }} />
          <input className="form-input" placeholder="6912345678" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
        </div>
        {field('Σύντομη περιγραφή')}
        <textarea className="form-input" rows={3} placeholder="Πείτε μας λίγα λόγια για εσάς..." value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'vertical' }} />
      </>)}

      {block('👩‍⚕️ Επαγγελματικά στοιχεία', <>
        {field('Κατηγορία', true)}
        <select className="form-input" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Επιλέξτε...</option>
          <option>Αποκλειστική / Νοσοκόμα</option>
          <option>Φυσιοθεραπευτής/τρια</option>
          <option>Οικιακή Βοηθός</option>
          <option>Βοηθός Ασθενών</option>
          <option>Εργοθεραπευτής/τρια</option>
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>{field('Χρόνια εμπειρίας')}<input className="form-input" type="number" min={0} max={50} placeholder="π.χ. 5" value={exp} onChange={e => setExp(e.target.value)} /></div>
          <div>{field('Ωριαία αμοιβή (€)', true)}<input className="form-input" type="number" min={7} placeholder="π.χ. 15" value={rate} onChange={e => setRate(e.target.value)} /></div>
        </div>
        {field('Αριθμός μητρώου ΕΦΚΑ / ΕΟΠΠΕΠ')}
        <input className="form-input" placeholder="Για το Kydo Verified badge" value={registry} onChange={e => setRegistry(e.target.value)} />
      </>)}

      {block('📍 Τοποθεσία', <>
        {field('Περιοχή κατοικίας', true)}
        <PlacesInput
          value={area}
          onChange={setArea}
          onPlaceSelect={(lat, lng, address) => {
            setArea(address)
            setAreaLat(lat)
            setAreaLng(lng)
          }}
        />
        {field('Ταχυδρομικός Κώδικας (ΤΚ)')}
        <input
          className="form-input"
          placeholder="π.χ. 11521"
          maxLength={5}
          value={postalCode}
          onChange={e => setPostalCode(e.target.value.replace(/\D/g, ''))}
        />
        {field('Μέγιστη απόσταση μετακίνησης')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
          <input type="range" min={1} max={50} value={maxDist} onChange={e => setMaxDist(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '55px' }}>{maxDist} χλμ</span>
        </div>
      </>)}

      {block('🗓 Ωράριο & Διαθεσιμότητα', <>
        {field('Τύπος απασχόλησης')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {TYPES.map(t => chip(t, selTypes, setSelTypes, true))}
        </div>
        {field('Διαθέσιμες ημέρες')}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
          {DAYS.map(d => (
            <div key={d} onClick={() => toggleItem(d, selDays, setSelDays)} style={{
              width: '38px', height: '34px', borderRadius: '10px', fontSize: '12px',
              border: `1.5px solid ${selDays.includes(d) ? 'var(--teal)' : 'var(--gray-m)'}`,
              background: selDays.includes(d) ? 'var(--teal)' : '#fff',
              color: selDays.includes(d) ? '#fff' : 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, cursor: 'pointer',
            }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Από</label><input type="time" className="form-input" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} /></div>
          <div><label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Έως</label><input type="time" className="form-input" value={timeTo} onChange={e => setTimeTo(e.target.value)} /></div>
        </div>
        {field('Kydo Express')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          <div onClick={() => setIsExpress(v => !v)} style={{
            padding: '8px 16px', borderRadius: '24px', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
            border: `1.5px solid ${isExpress ? 'var(--teal)' : 'var(--gray-m)'}`,
            background: isExpress ? 'var(--teal)' : '#fff',
            color: isExpress ? '#fff' : 'var(--text)',
          }}>⚡ Ενεργοποίηση Express</div>
        </div>
      </>)}

      {block('🎯 Εξειδικεύσεις', <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {SPECS.map(s => chip(s, selSpecs, setSelSpecs, true))}
        </div>
      </>)}

      {block('🌐 Πρόσθετα', <>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
          {EXTRAS.map(e => chip(e, selExtras, setSelExtras, true))}
        </div>
      </>)}

      {msg && <div className={`msg ${msgType === 'error' ? 'msg-error' : 'msg-success'}`}>{msg}</div>}

      <button onClick={savePro} style={{
        width: '100%', padding: '15px',
        background: 'linear-gradient(135deg,var(--teal),var(--teal2))',
        color: '#fff', border: 'none', borderRadius: 'var(--rs)',
        fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '1rem',
      }}>
        💾 Αποθήκευση προφίλ
      </button>
    </div>
  )
}