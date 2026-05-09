'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TIERS, type SubscriptionTier } from '@/lib/stripe-config'

export default function DashboardPage() {
  const router = useRouter()
  const sb = createClient()
  const [name, setName] = useState('')
  const [unlocks, setUnlocks] = useState(0)
  const [reviews, setReviews] = useState(0)
  const [favorites, setFavorites] = useState(0)
  const [activeSub, setActiveSub] = useState<any>(null)
  const [myJobs, setMyJobs] = useState<any[]>([])

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }

      const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      setName(profile?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || '')

      const { count: uc } = await sb.from('unlocks').select('*', { count: 'exact', head: true }).eq('family_id', session.user.id)
      setUnlocks(uc || 0)

      const { count: rc } = await sb.from('reviews').select('*', { count: 'exact', head: true }).eq('family_id', session.user.id)
      setReviews(rc || 0)

      const { count: fc } = await sb.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id)
      setFavorites(fc || 0)

      const { data: sub } = await sb.from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle()
      setActiveSub(sub)

      const { data: jobs } = await sb.from('job_postings')
        .select('id, title, status, is_urgent, created_at, expires_at')
        .eq('family_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      setMyJobs(jobs || [])
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

      {/* Subscription card */}
      {activeSub ? (
        <div style={{ background: activeSub.cancel_at_period_end ? 'linear-gradient(135deg, #c08a00, #d9a32d)' : 'linear-gradient(135deg, #0e7c5c, #14a373)', color: '#fff', borderRadius: 'var(--r)', padding: '1.4rem 1.6rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, opacity: .85, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>
              {activeSub.cancel_at_period_end ? '⚠️ Συνδρομή λήγει' : '✓ Ενεργή συνδρομή'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>
              {TIERS[activeSub.tier as SubscriptionTier]?.label || activeSub.tier}
            </div>
            <div style={{ fontSize: '13px', opacity: .9 }}>
              {activeSub.cancel_at_period_end
                ? `Δεν θα ανανεωθεί · Λήγει: ${new Date(activeSub.current_period_end).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Επόμενη ανανέωση: ${new Date(activeSub.current_period_end).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </div>
          </div>
          <button onClick={() => router.push('/upgrade')} style={{ padding: '10px 18px', background: '#fff', color: activeSub.cancel_at_period_end ? '#c08a00' : '#0e7c5c', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            Διαχείριση →
          </button>
        </div>
      ) : (
        <div onClick={() => router.push('/upgrade')} style={{ background: 'linear-gradient(135deg, #1e3a5f, #2a5080)', color: '#fff', borderRadius: 'var(--r)', padding: '1.2rem 1.4rem', marginBottom: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px' }}>
              {favorites > 0 ? `🔒 ${favorites} αγαπημέν${favorites === 1 ? 'ος' : 'οι'} κλειδωμέν${favorites === 1 ? 'ος' : 'οι'}` : '💎 Απεριόριστη πρόσβαση'}
            </div>
            <div style={{ fontSize: '13px', opacity: .9 }}>
              {favorites > 0
                ? `Με συνδρομή €19.99/μήνα δες όλα τα τηλέφωνα · ή €1.99 ανά pro (${favorites}× = €${(favorites * 1.99).toFixed(2)})`
                : '€19.99/μήνα ή €9.99/εβδομάδα — απεριόριστα στοιχεία επικοινωνίας'}
            </div>
          </div>
          <button style={{ padding: '10px 18px', background: '#fff', color: '#1e3a5f', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Δες πλάνα →
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Επαφές', val: unlocks, note: 'Επαγγελματίες επικοινωνίας', href: null },
          { label: '❤️ Αγαπημένοι', val: favorites, note: favorites > 0 ? 'Δες τους' : 'Αποθήκευσε pros', href: '/favorites' },
          { label: 'Αξιολογήσεις', val: reviews, note: 'Έχετε δώσει', href: null },
          { label: 'Express', val: 0, note: 'Ιστορικό', href: null },
        ].map(s => (
          <div
            key={s.label}
            onClick={s.href ? () => router.push(s.href!) : undefined}
            style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem', cursor: s.href ? 'pointer' : 'default' }}
          >
            <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.3px' }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, margin: '.3rem 0' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: 500 }}>{s.note}{s.href && ' →'}</div>
          </div>
        ))}
      </div>

      {/* My job postings */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.8rem', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px' }}>📋 Οι αγγελίες μου</div>
          <button onClick={() => router.push('/post-job')} style={{ padding: '8px 16px', borderRadius: 'var(--rs)', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            + Νέα αγγελία
          </button>
        </div>
        {myJobs.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--gray)', padding: '1rem 0' }}>
            Δεν έχεις δημιουργήσει αγγελίες. Δημοσίευσε μία και άσε τους επαγγελματίες να σε βρουν.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {myJobs.map(j => (
              <div key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: 'var(--rs)', border: '1px solid var(--gray-m)', cursor: 'pointer', background: '#fff' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray)' }}>
                    {new Date(j.created_at).toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })}
                    {j.is_urgent && ' · 🚨 Επείγον'}
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 9px', borderRadius: '10px', whiteSpace: 'nowrap',
                  background: j.status === 'open' ? 'var(--teal-l)' : 'var(--gray-l)',
                  color: j.status === 'open' ? 'var(--teal)' : 'var(--gray)',
                }}>
                  {j.status === 'open' ? 'ΑΝΟΙΧΤΗ' : j.status === 'filled' ? '✓ ΚΑΛΥΦΘΗΚΕ' : 'ΚΛΕΙΣΤΗ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '.8rem' }}>Γρήγορες ενέργειες</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-p" onClick={() => router.push('/search')}>Νέα αναζήτηση</button>
          <button onClick={() => router.push('/post-job')} style={{ padding: '10px 20px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--teal)', border: '1.5px solid var(--teal)' }}>+ Δημοσίευση αγγελίας</button>
          <button onClick={() => router.push('/search')} style={{ padding: '10px 20px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent', color: '#185fa5', border: '1.5px solid #185fa5' }}>⚡ Express</button>
        </div>
      </div>
    </div>
  )
}