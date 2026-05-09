'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type JobCard = {
  id: string
  title: string
  description: string
  category: string
  patient_info?: string
  area: string
  schedule_days: string[]
  schedule_hours?: string
  pay_per_hour?: number
  is_urgent: boolean
  created_at: string
}

export default function JobsListingPage() {
  const router = useRouter()
  const sb = createClient()
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/?login=1&redirect=/jobs'); return }

      const res = await fetch('/api/jobs')
      const data = await res.json()
      setJobs(data.jobs || [])

      const { data: unlocks } = await sb.from('job_unlocks').select('job_id').eq('professional_id', session.user.id)
      setUnlockedIds(new Set((unlocks || []).map((u: any) => u.job_id)))

      setLoading(false)
    })
  }, [])

  const filtered = filterCat ? jobs.filter(j => j.category === filterCat) : jobs
  const categories = Array.from(new Set(jobs.map(j => j.category)))

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '.4rem', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-.5px' }}>📋 Αγγελίες οικογενειών</h1>
        {!loading && <div style={{ fontSize: '13px', color: 'var(--gray)' }}>{filtered.length} ανοιχτ{filtered.length === 1 ? 'ή' : 'ές'}</div>}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '1.5rem' }}>
        Ξεκλείδωσε στοιχεία επικοινωνίας μιας οικογένειας με <strong>€1.99</strong> ή <strong>δωρεάν με Pro συνδρομή</strong>.
      </div>

      {!loading && categories.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <button onClick={() => setFilterCat('')} style={{
            padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px',
            border: `1.5px solid ${!filterCat ? 'var(--teal)' : 'var(--gray-m)'}`,
            background: !filterCat ? 'var(--teal)' : '#fff',
            color: !filterCat ? '#fff' : 'var(--text)',
            cursor: 'pointer',
          }}>Όλες</button>
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px',
              border: `1.5px solid ${filterCat === c ? 'var(--teal)' : 'var(--gray-m)'}`,
              background: filterCat === c ? 'var(--teal)' : '#fff',
              color: filterCat === c ? '#fff' : 'var(--text)',
              cursor: 'pointer',
            }}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Δεν υπάρχουν ανοιχτές αγγελίες προς το παρόν</div>
          <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '6px' }}>Έλεγξε ξανά αργότερα ή φρόντισε να εμφανίζεσαι στην αναζήτηση οικογενειών.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map(j => {
            const isUnlocked = unlockedIds.has(j.id)
            return (
              <div key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} style={{
                background: '#fff',
                border: `1px solid ${j.is_urgent ? '#f5c6c2' : 'var(--gray-m)'}`,
                borderLeft: j.is_urgent ? '4px solid var(--red)' : `1px solid var(--gray-m)`,
                borderRadius: 'var(--r)',
                padding: '1.2rem 1.4rem',
                cursor: 'pointer',
                transition: 'box-shadow .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {j.is_urgent && <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', background: 'var(--red)', padding: '3px 8px', borderRadius: '10px', letterSpacing: '.4px' }}>🚨 ΕΠΕΙΓΟΝ</span>}
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px' }}>{j.category}</span>
                  {isUnlocked && <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--teal)', background: 'var(--teal-l)', padding: '3px 8px', borderRadius: '10px', letterSpacing: '.4px' }}>✓ ΕΠΑΦΗ ΑΠΟΚΤΗΘΗΚΕ</span>}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{j.title}</div>
                {j.patient_info && <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '6px' }}>👤 {j.patient_info}</div>}
                <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{j.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--gray)' }}>
                  <span>📍 {j.area}</span>
                  {j.schedule_days?.length > 0 && <span>📅 {j.schedule_days.join(', ')}</span>}
                  {j.schedule_hours && <span>🕐 {j.schedule_hours}</span>}
                  {j.pay_per_hour && <span>💶 {j.pay_per_hour}€/ώρα</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
