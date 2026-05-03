'use client'

import PlacesInput from '@/components/PlacesInput'
import { DAYS } from '@/lib/auth'

const specs = ['Άνοια', 'Alzheimer', 'Parkinson', 'Παραπληγικοί', 'Μετεγχειρητική', 'Παιδιά ΑΝ', 'CPR', 'Διαβήτης']

interface Props {
  area: string
  setArea: (v: string) => void
  setAreaLat: (v: number | null) => void
  setAreaLng: (v: number | null) => void
  maxDist: number
  setMaxDist: (v: number) => void
  cat: string
  setCat: (v: string) => void
  selSpec: string[]
  toggleSpec: (s: string) => void
  selDays: string[]
  toggleDay: (d: string) => void
  minExp: number
  setMinExp: (v: number) => void
  maxPrice: number
  setMaxPrice: (v: number) => void
  wantExpress: boolean
  setWantExpress: (v: boolean) => void
  wantVerified: boolean
  setWantVerified: (v: boolean) => void
}

export default function FilterContent({
  area, setArea, setAreaLat, setAreaLng,
  maxDist, setMaxDist, cat, setCat,
  selSpec, toggleSpec, selDays, toggleDay,
  minExp, setMinExp, maxPrice, setMaxPrice,
  wantExpress, setWantExpress, wantVerified, setWantVerified,
}: Props) {

  const label = (text: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: '.7rem' }}>{text}</div>
  )

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        {label('Περιοχή')}
        <PlacesInput
          value={area}
          onChange={setArea}
          onPlaceSelect={(lat, lng, address) => { setArea(address); setAreaLat(lat); setAreaLng(lng) }}
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Μέγιστη απόσταση')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={1} max={50} value={maxDist} onChange={e => setMaxDist(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>{maxDist} χλμ</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Κατηγορία')}
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none' }}>
          <option value="">Όλες</option>
          <option>Νοσοκόμος/α</option><option>Αποκλειστική</option>
          <option>Οικιακή βοηθός</option><option>Φυσιοθεραπευτής</option>
          <option>Εργοθεραπευτής</option><option>Βοηθός Ασθενών</option>
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Εξειδίκευση')}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
          {specs.map(s => (
            <div key={s} className={`chip ${selSpec.includes(s) ? 'on' : ''}`} onClick={() => toggleSpec(s)}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Διαθέσιμες ημέρες')}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' as const }}>
          {DAYS.map(d => (
            <div key={d} onClick={() => toggleDay(d)} style={{
              width: '36px', height: '32px', borderRadius: '8px', fontSize: '11px',
              border: `1.5px solid ${selDays.includes(d) ? 'var(--text)' : 'var(--gray-m)'}`,
              background: selDays.includes(d) ? 'var(--text)' : '#fff',
              color: selDays.includes(d) ? '#fff' : 'var(--text)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, cursor: 'pointer',
            }}>{d}</div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Χρόνια εμπειρίας (ελάχιστο)')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={0} max={20} value={minExp} onChange={e => setMinExp(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>{minExp}+ χρ</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Μέγιστη ωριαία αμοιβή')}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={7} max={60} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>€{maxPrice}</span>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {label('Επαλήθευση')}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
          <div className={`chip ${wantExpress ? 'on' : ''}`} onClick={() => setWantExpress(!wantExpress)}>⚡ Express</div>
          <div className={`chip ${wantVerified ? 'on' : ''}`} onClick={() => setWantVerified(!wantVerified)}>✓ Verified</div>
        </div>
      </div>
    </>
  )
}