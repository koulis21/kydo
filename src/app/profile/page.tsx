'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { strToColor, getInitials, parseDays, DAYS } from '@/lib/auth'
import type { Professional, Review } from '@/lib/supabase'

type ProFull = Professional & {
  name: string
  color: string
  initials: string
  days: number[]
}

export default function ProfilePage() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('id')
  const sb = createClient()

  const [pro, setPro] = useState<ProFull | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState('')
  const [userReview, setUserReview] = useState<any>(null)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviewMsgType, setReviewMsgType] = useState<'error'|'success'>('error')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { router.push('/search'); return }
    loadAll()
  }, [id])

  async function loadAll() {
    const { data: { session } } = await sb.auth.getSession()
    setUser(session?.user ?? null)

    if (session?.user) {
      const { data: profile } = await sb.from('profiles').select('role').eq('id', session.user.id).single()
      setUserRole(profile?.role || 'family')
      const { data: ur } = await sb.from('reviews').select('*').eq('professional_id', id).eq('family_id', session.user.id).maybeSingle()
      setUserReview(ur)
    }

    const { data: proData } = await sb.from('professionals')
      .select('*,profiles!inner(full_name,area,phone)')
      .eq('id', id)
      .single()

    if (proData) {
      setPro({
        ...proData,
        name: (proData as any).profiles.full_name,
        color: strToColor(proData.id),
        initials: getInitials((proData as any).profiles.full_name),
        days: parseDays(proData.available_days || []),
      })
    }

    const { data: rvs } = await sb.from('reviews')
      .select('*,profiles(full_name)')
      .eq('professional_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    setReviews(rvs || [])
    setLoading(false)
  }

  async function submitReview() {
    if (!stars) { setReviewMsg('Επιλέξτε αστέρια.'); setReviewMsgType('error'); return }
    if (!comment) { setReviewMsg('Γράψτε ένα σχόλιο.'); setReviewMsgType('error'); return }

    const { error } = await sb.from('reviews').insert({ professional_id: id, family_id: user.id, rating: stars, comment })
    if (error) { setReviewMsg('Σφάλμα: ' + error.message); setReviewMsgType('error'); return }

    const { data: all } = await sb.from('reviews').select('rating').eq('professional_id', id)
    if (all?.length) {
      const avg = all.reduce((s: number, r: any) => s + r.rating, 0) / all.length
      await sb.from('professionals').update({ rating: Math.round(avg * 10) / 10, total_reviews: all.length }).eq('id', id)
    }
    setReviewMsg('✓ Η αξιολόγηση υποβλήθηκε!'); setReviewMsgType('success')
    setTimeout(() => loadAll(), 1500)
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>
  if (!pro) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>Δεν βρέθηκε ο επαγγελματίας.</div>

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div onClick={() => router.push('/search')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>

      {/* Hero */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', background: 'var(--gray-l)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: pro.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
          {pro.initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>{pro.name}</div>
          <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '8px' }}>
            {pro.category}
            {pro.rating > 0 && ` · ★ ${pro.rating.toFixed(1)} (${pro.total_reviews})`}
            {pro.experience_years > 0 && ` · ${pro.experience_years} χρ.`}
            {pro.area && ` · 📍 ${pro.area}`}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {pro.is_verified && <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, background: 'var(--teal-l)', color: 'var(--teal)' }}>✓ Kydo Verified</span>}
            {pro.has_criminal_check && <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, background: 'var(--blue-l)', color: 'var(--blue)' }}>Ποινικό μητρώο</span>}
            {pro.experience_years > 0 && <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, background: 'var(--amber-l)', color: 'var(--amber)' }}>{pro.experience_years} χρ.</span>}
            {pro.is_express && <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, background: 'var(--blue-l)', color: 'var(--blue)' }}>⚡ Express</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
            {pro.specializations?.map((t: string) => (
              <span key={t} style={{ fontSize: '11px', background: 'var(--gray-m)', color: 'var(--gray)', padding: '3px 9px', borderRadius: '10px', fontWeight: 500 }}>{t}</span>
            ))}
          </div>

          {/* Actions */}
          {!user ? (
            <div style={{ background: 'var(--gray-l)', borderRadius: 'var(--r)', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.5rem' }}>🔒 Ξεκλείδωσε τα στοιχεία επικοινωνίας</div>
              <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '1rem' }}>Συνδεθείτε για να δείτε τηλέφωνο και email.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => alert('Unlock €19!')} style={{ padding: '12px 24px', borderRadius: 'var(--rs)', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'var(--teal)', color: '#fff' }}>
                Unlock €19
              </button>
              {pro.is_express && (
                <button style={{ padding: '12px 24px', borderRadius: 'var(--rs)', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', background: 'var(--blue)', color: '#fff' }}>
                  ⚡ Express €44
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.8rem' }}>Εξειδικεύσεις</div>
          {pro.specializations?.length ? pro.specializations.map((s: string) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal2)', flexShrink: 0 }} />{s}
            </div>
          )) : <div style={{ fontSize: '13px', color: 'var(--gray)' }}>Δεν έχουν οριστεί</div>}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.8rem' }}>Εβδομαδιαίο Πρόγραμμα</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '10px' }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', padding: '6px 2px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: pro.days[i] ? 'var(--teal-l)' : 'var(--gray-l)', color: pro.days[i] ? 'var(--teal)' : '#bbb' }}>{d}</div>
            ))}
          </div>
          {pro.area && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal2)' }} />📍 {pro.area}</div>}
          {pro.time_from && pro.time_to && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '6px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal2)' }} />🕐 {pro.time_from} – {pro.time_to}</div>}
          {pro.bio && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--teal2)' }} />📝 {pro.bio}</div>}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '.8rem' }}>Αξιολογήσεις Kydo</div>
        {reviews.length ? reviews.map(r => (
          <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--gray-m)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{(r as any).profiles?.full_name || 'Ανώνυμος'}</span>
              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>{new Date(r.created_at).toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '4px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <div style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>{r.comment}</div>
          </div>
        )) : <div style={{ fontSize: '13px', color: 'var(--gray)', padding: '1rem 0' }}>Δεν υπάρχουν αξιολογήσεις ακόμα.</div>}

        {/* Review form */}
        {user && userRole === 'family' && !userReview && (
          <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--gray-m)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '.8rem' }}>Αφήστε την αξιολόγησή σας</div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '.8rem' }}>
              {[1,2,3,4,5].map(i => (
                <span key={i} onClick={() => setStars(i)} style={{ fontSize: '1.8rem', cursor: 'pointer', color: i <= stars ? '#f59e0b' : '#ddd', transition: 'color .1s' }}>★</span>
              ))}
            </div>
            <textarea className="form-input" rows={3} placeholder="Πείτε μας την εμπειρία σας..." value={comment} onChange={e => setComment(e.target.value)} style={{ marginBottom: '.8rem', resize: 'vertical' }} />
            {reviewMsg && <div className={`msg ${reviewMsgType === 'error' ? 'msg-error' : 'msg-success'}`} style={{ marginBottom: '.8rem' }}>{reviewMsg}</div>}
            <button onClick={submitReview} style={{ padding: '11px 24px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              Υποβολή αξιολόγησης
            </button>
          </div>
        )}
        {user && userReview && (
          <div style={{ fontSize: '13px', color: 'var(--teal)', marginTop: '1rem', padding: '.8rem', background: 'var(--teal-l)', borderRadius: 'var(--rs)' }}>
            ✓ Έχετε ήδη αξιολογήσει αυτόν τον επαγγελματία.
          </div>
        )}
      </div>

      <style>{`@media(max-width:768px){.profile-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}