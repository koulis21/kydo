'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const sb = createClient()
  const [name, setName] = useState('')
  const [unlocks, setUnlocks] = useState(0)
  const [reviews, setReviews] = useState(0)

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }

      const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      setName(profile?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || '')

      const { count: uc } = await sb.from('unlocks').select('*', { count: 'exact', head: true }).eq('family_id', session.user.id)
      setUnlocks(uc || 0)

      const { count: rc } = await sb.from('reviews').select('*', { count: 'exact', head: true }).eq('family_id', session.user.id)
      setReviews(rc || 0)
    })
  }, [])

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.3rem', letterSpacing: '-.5px' }}>Πίνακας Οικογένειας</div>
      <div style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '1.5rem' }}>Καλωσήρθατε στο Kydo</div>

      {name && (
        <div style={{ background: 'var(--teal-l)', borderRadius: 'var(--r)', padding: '1.2rem', marginBottom: '1.5rem', fontSize: '14px', color: 'var(--teal)', fontWeight: 500, border: '1px solid #b8e8d8' }}>
          👋 Καλωσήρθες, {name}! Ξεκίνα την αναζήτηση.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Unlocks', val: unlocks, note: 'Επαφές ξεκλειδωμένες' },
          { label: 'Αξιολογήσεις', val: reviews, note: 'Έχετε δώσει' },
          { label: 'Express', val: 0, note: 'Ιστορικό' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
            <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px' }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '.3rem 0' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 500 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.8rem' }}>Γρήγορες ενέργειες</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-p" onClick={() => router.push('/search')}>Νέα αναζήτηση</button>
          <button onClick={() => router.push('/search')} style={{ padding: '10px 20px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#185fa5', border: '1.5px solid #185fa5' }}>⚡ Express</button>
        </div>
      </div>
    </div>
  )
}