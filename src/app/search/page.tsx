'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Professional } from '@/lib/supabase'
import { strToColor, getInitials, parseDays, calcDist, DAYS } from '@/lib/auth'

type ProCard = Professional & {
  name: string
  color: string
  initials: string
  days: number[]
  distFromSearch?: number | null
}

export default function SearchPage() {
  const router = useRouter()
  const [allPros, setAllPros] = useState<ProCard[]>([])
  const [filtered, setFiltered] = useState<ProCard[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [area, setArea] = useState('')
  const [areaLat, setAreaLat] = useState<number | null>(null)
  const [areaLng, setAreaLng] = useState<number | null>(null)
  const [cat, setCat] = useState('')
  const [maxDist, setMaxDist] = useState(50)
  const [minExp, setMinExp] = useState(0)
  const [maxPrice, setMaxPrice] = useState(60)
  const [selDays, setSelDays] = useState<string[]>([])
  const [selSpec, setSelSpec] = useState<string[]>([])
  const [wantExpress, setWantExpress] = useState(false)
  const [wantVerified, setWantVerified] = useState(false)
  const [sort, setSort] = useState('rating')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => { loadPros() }, [])

  async function loadPros() {
    const sb = createClient()
    const { data } = await sb.from('professionals')
      .select('*,profiles!inner(full_name,area,phone)')
      .not('category', 'is', null).neq('category', '')
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })

    const pros: ProCard[] = (data || [])
      .filter((p: any) => p.profiles?.full_name?.trim())
      .map((p: any) => ({
        ...p,
        name: p.profiles.full_name,
        color: strToColor(p.id),
        initials: getInitials(p.profiles.full_name),
        days: parseDays(p.available_days || []),
        distFromSearch: null,
      }))

    setAllPros(pros)
    setFiltered(pros)
    setLoading(false)
  }

  const applyFilters = useCallback(() => {
    let result = allPros.filter(p => {
      if (p.experience_years < minExp) return false
      if (p.hourly_rate > 0 && p.hourly_rate > maxPrice) return false
      if (cat && !p.category.toLowerCase().includes(cat.toLowerCase())) return false
      if (wantExpress && !p.is_express) return false
      if (wantVerified && !p.is_verified) return false
      if (selDays.length > 0) {
        const pd = DAYS.filter((_, i) => p.days[i])
        if (!selDays.some(d => pd.includes(d))) return false
      }
      if (selSpec.length > 0) {
        if (!selSpec.some(s => p.specializations?.some((t: string) =>
          t.toLowerCase().includes(s.toLowerCase())))) return false
      }
      if (areaLat && areaLng && p.lat && p.lng) {
        const d = calcDist(areaLat, areaLng, p.lat, p.lng)
        p.distFromSearch = d
        if (d > maxDist) return false
      } else {
        p.distFromSearch = null
      }
      return true
    })

    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)
    else if (sort === 'dist') result.sort((a, b) => (a.distFromSearch ?? 999) - (b.distFromSearch ?? 999))
    else if (sort === 'price') result.sort((a, b) => a.hourly_rate - b.hourly_rate)
    else if (sort === 'exp') result.sort((a, b) => b.experience_years - a.experience_years)

    setFiltered(result)
  }, [allPros, minExp, maxPrice, cat, wantExpress, wantVerified, selDays, selSpec, areaLat, areaLng, maxDist, sort])

  useEffect(() => { applyFilters() }, [applyFilters])

  function toggleDay(d: string) {
    setSelDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }
  function toggleSpec(s: string) {
    setSelSpec(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function clearFilters() {
    setArea(''); setAreaLat(null); setAreaLng(null)
    setCat(''); setMaxDist(50); setMinExp(0); setMaxPrice(60)
    setSelDays([]); setSelSpec([]); setWantExpress(false); setWantVerified(false)
  }

  const specs = ['Άνοια', 'Alzheimer', 'Parkinson', 'Παραπληγικοί', 'Μετεγχειρητική', 'Παιδιά ΑΝ', 'CPR', 'Διαβήτης']

  const FilterContent = () => (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Περιοχή</div>
        <input type="text" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none' }}
          placeholder="π.χ. Γλυφάδα, Αθήνα" value={area} onChange={e => setArea(e.target.value)} />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Μέγιστη απόσταση</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={1} max={50} value={maxDist} onChange={e => setMaxDist(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>{maxDist} χλμ</span>
        </div>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Κατηγορία</div>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '14px', outline: 'none' }}>
          <option value="">Όλες</option>
          <option>Νοσοκόμος/α</option><option>Αποκλειστική</option>
          <option>Οικιακή βοηθός</option><option>Φυσιοθεραπευτής</option>
          <option>Εργοθεραπευτής</option><option>Βοηθός Ασθενών</option>
        </select>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Εξειδίκευση</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {specs.map(s => (
            <div key={s} className={`chip ${selSpec.includes(s) ? 'on' : ''}`} onClick={() => toggleSpec(s)}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Διαθέσιμες ημέρες</div>
        <div style={{ display: 'flex', gap: '5px' }}>
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
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Χρόνια εμπειρίας (ελάχιστο)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={0} max={20} value={minExp} onChange={e => setMinExp(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>{minExp}+ χρ</span>
        </div>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Μέγιστη ωριαία αμοιβή</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="range" min={7} max={60} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ flex: 1, accentColor: 'var(--teal)' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', minWidth: '48px' }}>€{maxPrice}</span>
        </div>
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.7rem' }}>Επαλήθευση</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <div className={`chip ${wantExpress ? 'on' : ''}`} onClick={() => setWantExpress(v => !v)}>⚡ Express</div>
          <div className={`chip ${wantVerified ? 'on' : ''}`} onClick={() => setWantVerified(v => !v)}>✓ Verified</div>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'grid', gridTemplateColumns: '300px 1fr' }} className="search-layout">
      {/* Desktop Sidebar */}
      <div style={{
        background: '#fff', borderRight: '1px solid var(--gray-m)',
        padding: '1.5rem', overflowY: 'auto',
        height: 'calc(100vh - 64px)', position: 'sticky', top: '64px',
      }} className="filter-sidebar">
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Φίλτρα
          <button onClick={clearFilters} style={{ fontSize: '12px', color: 'var(--teal)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>Καθαρισμός</button>
        </div>
        <FilterContent />
        <button onClick={applyFilters} style={{ width: '100%', padding: '13px', background: 'var(--teal)', border: 'none', borderRadius: 'var(--rs)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
          Εφαρμογή φίλτρων
        </button>
      </div>

      {/* Results */}
      <div style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>
            {loading ? 'Φόρτωση...' : `${filtered.length} επαγγελματία${filtered.length === 1 ? 'ς' : 'ες'}`}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 14px', border: '1.5px solid var(--gray-m)', borderRadius: '24px', fontSize: '13px', fontWeight: 500, background: '#fff', cursor: 'pointer', outline: 'none' }}>
            <option value="rating">Κορυφαίοι πρώτα</option>
            <option value="dist">Κοντινότεροι</option>
            <option value="price">Χαμηλότερη τιμή</option>
            <option value="exp">Περισσότερη εμπειρία</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>⏳</div>
            <div style={{ fontWeight: 600 }}>Φόρτωση...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🔍</div>
            <div style={{ fontWeight: 600, marginBottom: '.3rem' }}>Δεν βρέθηκαν αποτελέσματα</div>
            <div style={{ fontSize: '13px' }}>Δοκιμάστε να αλλάξετε τα φίλτρα</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
            {filtered.map(p => (
              <div key={p.id} className="pro-card" onClick={() => router.push(`/profile?id=${p.id}`)}>
                <div style={{ height: '140px', background: 'linear-gradient(135deg,#f0faf6,#e0f4ec)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {p.is_express && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#fff', color: 'var(--teal)', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.1)' }}>⚡ Express</div>}
                  {p.is_featured && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--blue)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>★ Top</div>}
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
                    {p.initials}
                  </div>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '6px' }}>{p.category}</div>
                  {p.rating > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#222"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {p.rating.toFixed(1)} <span style={{ color: 'var(--gray)', fontWeight: 400 }}>({p.total_reviews} αξιολογήσεις)</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>Νέος επαγγελματίας</div>
                  )}
                  {p.specializations?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {p.specializations.slice(0, 3).map((t: string) => (
                        <span key={t} style={{ fontSize: '11px', background: 'var(--gray-l)', color: 'var(--gray)', padding: '3px 9px', borderRadius: '10px', fontWeight: 500 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                    {DAYS.map((d, i) => (
                      <div key={d} style={{ width: '28px', height: '24px', borderRadius: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, background: p.days[i] ? 'var(--teal-l)' : 'var(--gray-l)', color: p.days[i] ? 'var(--teal)' : '#bbb' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--gray-m)' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>
                      {p.hourly_rate > 0 ? <>{p.hourly_rate}€ <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--gray)' }}>/ ώρα</span></> : <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--gray)' }}>Κατόπιν συμφωνίας</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      {p.distFromSearch != null ? `📍 ${p.distFromSearch.toFixed(1)} χλμ` : p.area ? `📍 ${p.area}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){
          .search-layout{grid-template-columns:1fr!important}
          .filter-sidebar{display:none!important}
        }
      `}</style>
    </div>
  )
}