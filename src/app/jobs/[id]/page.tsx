'use client'

import { useEffect, useState, Suspense, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { JobPosting } from '@/lib/jobs'

function JobDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'family' | 'professional' | ''>('')
  const [job, setJob] = useState<JobPosting | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [contact, setContact] = useState<{ name: string | null; phone: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [applicantsCount, setApplicantsCount] = useState(0)

  useEffect(() => {
    loadAll()
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false) }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [id])

  async function loadAll() {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { router.push('/'); return }
    setUser(session.user)
    const { data: profile } = await sb.from('profiles').select('role').eq('id', session.user.id).single()
    setRole(profile?.role || '')

    const res = await fetch(`/api/jobs/${id}`)
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Δεν βρέθηκε αγγελία'); setLoading(false); return }
    setJob(data.job)

    if (profile?.role === 'professional') {
      const { data: unlock } = await sb.from('job_unlocks').select('id').eq('job_id', id).eq('professional_id', session.user.id).maybeSingle()
      if (unlock) {
        setUnlocked(true)
        const cRes = await fetch(`/api/jobs/${id}/contact`)
        if (cRes.ok) setContact(await cRes.json())
      }
    } else if (profile?.role === 'family' && data.job.family_id === session.user.id) {
      const { count } = await sb.from('job_unlocks').select('*', { count: 'exact', head: true }).eq('job_id', id)
      setApplicantsCount(count || 0)
    }

    setLoading(false)
  }

  // After Stripe success
  useEffect(() => {
    if (params.get('paid') === '1' && job && role === 'professional' && !unlocked) {
      // Webhook may take a moment — give it a beat then refresh
      setTimeout(() => {
        loadAll()
        window.history.replaceState({}, '', `/jobs/${id}`)
      }, 1500)
    }
  }, [params, job, role])

  async function unlockJob() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/jobs/${id}/checkout`, { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      if (data.viaSubscription || data.alreadyUnlocked) {
        await loadAll()
        setBusy(false)
        return
      }
      throw new Error(data.error || 'unknown')
    } catch (err: any) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function deleteJob() {
    if (!confirm('Σίγουρα θέλεις να διαγράψεις αυτή την αγγελία;')) return
    setBusy(true)
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      router.push('/dashboard')
    } catch {
      setBusy(false)
    }
  }

  async function setStatus(status: 'open' | 'filled' | 'closed') {
    setBusy(true)
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      await loadAll()
    } catch {
      setError('Αποτυχία ενημέρωσης')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>
  if (error && !job) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>{error}</div>
  if (!job) return null

  const isOwner = user && job.family_id === user.id

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.6rem 1.8rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {job.is_urgent && <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', background: 'var(--red)', padding: '4px 10px', borderRadius: '12px', letterSpacing: '.4px' }}>🚨 ΕΠΕΙΓΟΝ</span>}
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{job.category}</span>
          {job.status !== 'open' && <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', background: 'var(--gray-l)', padding: '3px 9px', borderRadius: '10px' }}>{job.status === 'filled' ? '✓ Καλύφθηκε' : 'Κλειστή'}</span>}
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '1rem', letterSpacing: '-.3px' }}>{job.title}</h1>

        {job.patient_info && (
          <div style={{ background: 'var(--gray-l)', borderRadius: 'var(--rs)', padding: '10px 14px', marginBottom: '1rem', fontSize: '14px' }}>
            <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '.4px' }}>Ασθενής</strong>
            <div style={{ marginTop: '4px' }}>👤 {job.patient_info}</div>
          </div>
        )}

        <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text)', marginBottom: '1.2rem', whiteSpace: 'pre-wrap' }}>
          {job.description}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px', padding: '1rem', background: 'var(--gray-l)', borderRadius: 'var(--rs)', marginBottom: '1.2rem' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '4px' }}>Περιοχή</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>📍 {job.area}</div>
          </div>
          {job.schedule_days?.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '4px' }}>Ημέρες</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>📅 {job.schedule_days.join(', ')}</div>
            </div>
          )}
          {job.schedule_hours && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '4px' }}>Ωράριο</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>🕐 {job.schedule_hours}</div>
            </div>
          )}
          {job.pay_per_hour && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '4px' }}>Αμοιβή</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>💶 {job.pay_per_hour}€/ώρα</div>
            </div>
          )}
        </div>

        {/* Pro view: contact section */}
        {role === 'professional' && (
          unlocked && contact ? (
            <div style={{ background: 'var(--teal-l)', border: '1px solid #b8e8d8', borderRadius: 'var(--rs)', padding: '1rem 1.2rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>✓ Στοιχεία επικοινωνίας</div>
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{contact.name || 'Οικογένεια'}</div>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} style={{ fontSize: '17px', fontWeight: 800, color: 'var(--teal)', textDecoration: 'none' }}>
                  📞 {contact.phone}
                </a>
              )}
            </div>
          ) : job.status === 'open' ? (
            <div style={{ border: '1.5px dashed var(--gray-m)', borderRadius: 'var(--rs)', padding: '1.2rem 1.4rem' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>🔒 Στοιχεία επικοινωνίας</div>
              <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '12px', lineHeight: 1.5 }}>
                Ξεκλείδωσε για να επικοινωνήσεις απευθείας με την οικογένεια. Pro συνδρομητές: <strong>δωρεάν</strong>.
              </div>
              <button onClick={unlockJob} disabled={busy} style={{ padding: '12px 22px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '14px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Ανακατεύθυνση...' : '🔓 Ξεκλείδωσε €1.99'}
              </button>
              {error && <div className="msg msg-error" style={{ marginTop: '10px', fontSize: '13px' }}>{error}</div>}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--gray)', padding: '1rem', background: 'var(--gray-l)', borderRadius: 'var(--rs)' }}>
              Η αγγελία δεν είναι πλέον ενεργή.
            </div>
          )
        )}

        {/* Family owner view */}
        {isOwner && (
          <div style={{ borderTop: '1px solid var(--gray-m)', paddingTop: '1rem', marginTop: '1rem' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
              📊 {applicantsCount} επαγγελματί{applicantsCount === 1 ? 'ας' : 'ες'} έχ{applicantsCount === 1 ? 'ει' : 'ουν'} ξεκλειδώσει
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {job.status === 'open' && (
                <>
                  <button onClick={() => setStatus('filled')} disabled={busy} style={{ padding: '9px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Σημείωση ως καλυμμένη
                  </button>
                  <button onClick={() => setStatus('closed')} disabled={busy} style={{ padding: '9px 16px', background: '#fff', color: 'var(--text)', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    Κλείσιμο
                  </button>
                </>
              )}
              {job.status !== 'open' && (
                <button onClick={() => setStatus('open')} disabled={busy} style={{ padding: '9px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  ↻ Επανεκκίνηση αγγελίας
                </button>
              )}
              <button onClick={deleteJob} disabled={busy} style={{ padding: '9px 16px', background: '#fff', color: 'var(--red)', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Διαγραφή
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>⏳ Φόρτωση...</div>}>
      <JobDetailContent id={id} />
    </Suspense>
  )
}
