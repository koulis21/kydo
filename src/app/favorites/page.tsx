'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { strToColor, getInitials, parseDays, DAYS, maskName } from '@/lib/auth'

type FavCard = {
  id: string
  name: string
  color: string
  initials: string
  category: string
  rating: number
  total_reviews: number
  hourly_rate: number
  area?: string
  experience_years: number
  is_express: boolean
  is_featured: boolean
  specializations: string[]
  days: number[]
}

export default function FavoritesPage() {
  const router = useRouter()
  const [favs, setFavs] = useState<FavCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }

      // RLS scopes favorites to the current user
      const { data } = await sb.from('favorites')
        .select('professional_id, created_at, professionals!inner(*, profiles!inner(full_name, area))')
        .order('created_at', { ascending: false })

      const cards: FavCard[] = (data || []).map((row: any) => {
        const p = row.professionals
        return {
          id: p.id,
          name: p.profiles.full_name,
          color: strToColor(p.id),
          initials: getInitials(p.profiles.full_name),
          category: p.category,
          rating: p.rating,
          total_reviews: p.total_reviews,
          hourly_rate: p.hourly_rate,
          area: p.area,
          experience_years: p.experience_years,
          is_express: p.is_express,
          is_featured: p.is_featured,
          specializations: p.specializations || [],
          days: parseDays(p.available_days || []),
        }
      })
      setFavs(cards)
      setLoading(false)
    })
  }, [])

  async function removeFavorite(e: React.MouseEvent, proId: string) {
    e.stopPropagation()
    setFavs(prev => prev.filter(f => f.id !== proId))
    try {
      await fetch(`/api/favorites?professional_id=${proId}`, { method: 'DELETE' })
    } catch {
      // Silent fail; if it actually failed, refresh will restore
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>

      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.3rem', letterSpacing: '-.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#e63946" stroke="#e63946" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        Αγαπημένοι Επαγγελματίες
      </div>
      <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '1.5rem' }}>
        {loading ? 'Φόρτωση...' : favs.length === 0 ? 'Δεν έχεις αγαπημένους ακόμα' : `${favs.length} επαγγελματία${favs.length === 1 ? 'ς' : 'ες'}`}
      </div>

      {!loading && favs.length === 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💔</div>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '.6rem' }}>Δεν έχεις αποθηκεύσει επαγγελματίες</div>
          <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '1.4rem', maxWidth: '380px', margin: '0 auto 1.4rem' }}>
            Στην αναζήτηση πάτα την καρδιά ❤️ σε επαγγελματίες που σε ενδιαφέρουν, για να τους βρίσκεις εύκολα εδώ.
          </div>
          <button onClick={() => router.push('/search')} className="btn btn-p">Αναζήτηση επαγγελματιών</button>
        </div>
      )}

      {!loading && favs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.5rem' }}>
          {favs.map(p => (
            <div key={p.id} className="pro-card" onClick={() => router.push(`/profile?id=${p.id}`)}>
              <div style={{ height: '140px', background: 'linear-gradient(135deg,#f0faf6,#e0f4ec)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.is_express && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#fff', color: 'var(--teal)', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', boxShadow: '0 1px 6px rgba(0,0,0,.1)' }}>⚡ Express</div>}
                {p.is_featured && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--blue)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>★ Top</div>}
                <button
                  onClick={(e) => removeFavorite(e, p.id)}
                  title="Αφαίρεση από αγαπημένα"
                  style={{ position: 'absolute', bottom: '10px', right: '10px', width: '34px', height: '34px', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 6px rgba(0,0,0,.15)', padding: 0 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#e63946" stroke="#e63946" strokeWidth="2.2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>{p.initials}</div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>{maskName(p.name)}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '6px' }}>{p.category}</div>
                {p.rating > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#222"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {p.rating.toFixed(1)} <span style={{ color: 'var(--gray)', fontWeight: 400 }}>({p.total_reviews})</span>
                  </div>
                ) : <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>Νέος επαγγελματίας</div>}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                  {DAYS.map((d, i) => <div key={d} style={{ width: '28px', height: '24px', borderRadius: '6px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, background: p.days[i] ? 'var(--teal-l)' : 'var(--gray-l)', color: p.days[i] ? 'var(--teal)' : '#bbb' }}>{d}</div>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--gray-m)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>
                    {p.hourly_rate > 0 ? <>{p.hourly_rate}€ <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--gray)' }}>/ ώρα</span></> : <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--gray)' }}>Κατόπιν συμφωνίας</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                    {p.area ? `📍 ${p.area}` : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
