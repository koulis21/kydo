'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TIERS, type SubscriptionTier, type TierInfo } from '@/lib/stripe-config'

function UpgradeContent() {
  const router = useRouter()
  const params = useSearchParams()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'family' | 'professional' | ''>('')
  const [activeSub, setActiveSub] = useState<any>(null)
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null)
  const [msg, setMsg] = useState<string>('')
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('')

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      setUser(session.user)
      const { data: profile } = await sb.from('profiles').select('role').eq('id', session.user.id).single()
      setRole(profile?.role || 'family')

      const { data: sub } = await sb.from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .maybeSingle()
      setActiveSub(sub)
    })

    // bfcache restore: reset loading state
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setLoadingTier(null) }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  useEffect(() => {
    if (params.get('success') === '1') {
      setMsg('✓ Η συνδρομή ενεργοποιήθηκε! Καλωσήρθες.')
      setMsgType('success')
      window.history.replaceState({}, '', '/upgrade')
    } else if (params.get('canceled') === '1') {
      setMsg('Η πληρωμή ακυρώθηκε.')
      setMsgType('error')
      window.history.replaceState({}, '', '/upgrade')
    }
  }, [params])

  async function subscribe(tier: SubscriptionTier) {
    setLoadingTier(tier)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setMsg('Σφάλμα: ' + (data.error || 'unknown')); setMsgType('error'); setLoadingTier(null) }
    } catch {
      setMsg('Σφάλμα σύνδεσης.'); setMsgType('error'); setLoadingTier(null)
    }
  }

  async function manageBilling() {
    setLoadingTier('family_weekly') // any value to disable buttons
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setMsg('Σφάλμα: ' + (data.error || 'unknown')); setMsgType('error'); setLoadingTier(null) }
    } catch {
      setMsg('Σφάλμα σύνδεσης.'); setMsgType('error'); setLoadingTier(null)
    }
  }

  if (!user) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>

  const visibleTiers = (Object.values(TIERS) as TierInfo[]).filter(t =>
    role === 'professional' ? t.audience === 'pro' : t.audience === 'family'
  )

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px 0', marginBottom: '1rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '.5rem', letterSpacing: '-.5px' }}>
          {role === 'professional' ? 'Αναβάθμιση Pro' : 'Συνδρομή Kydo'}
        </div>
        <div style={{ fontSize: '15px', color: 'var(--gray)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.5 }}>
          {role === 'professional'
            ? 'Ξεχώρισε από τους συναδέλφους σου και αύξησε την προβολή σου στις οικογένειες.'
            : 'Απεριόριστη πρόσβαση σε επαγγελματίες — χωρίς να πληρώνεις ξεχωριστά για κάθε ξεκλείδωμα.'}
        </div>
      </div>

      {msg && (
        <div className={`msg ${msgType === 'error' ? 'msg-error' : 'msg-success'}`} style={{ marginBottom: '1.2rem', textAlign: 'center' }}>
          {msg}
        </div>
      )}

      {activeSub && (
        <div style={{ background: 'var(--teal-l)', border: '1px solid #b8e8d8', borderRadius: 'var(--r)', padding: '1.2rem 1.4rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal)', marginBottom: '4px' }}>
            ✓ Έχεις ενεργή συνδρομή: {TIERS[activeSub.tier as SubscriptionTier]?.label}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '10px' }}>
            Λήξη περιόδου: {new Date(activeSub.current_period_end).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {activeSub.cancel_at_period_end && ' · Έχει ακυρωθεί η αυτόματη ανανέωση'}
          </div>
          <button onClick={manageBilling} disabled={loadingTier !== null} style={{ padding: '10px 18px', background: '#fff', color: 'var(--teal)', border: '1.5px solid var(--teal)', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: loadingTier ? 'not-allowed' : 'pointer' }}>
            Διαχείριση συνδρομής
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleTiers.length}, 1fr)`, gap: '1.2rem' }} className="upgrade-grid">
        {visibleTiers.map(tier => (
          <div key={tier.id} style={{
            background: '#fff',
            border: tier.highlight ? '2px solid var(--teal)' : '1px solid var(--gray-m)',
            borderRadius: 'var(--r)',
            padding: '1.6rem 1.4rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {tier.highlight && (
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--teal)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', letterSpacing: '.3px' }}>
                ΔΗΜΟΦΙΛΕΣ
              </div>
            )}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>
              {tier.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>{tier.priceLabel}</span>
              <span style={{ fontSize: '14px', color: 'var(--gray)' }}>/ {tier.intervalLabel}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.4rem 0', flex: 1 }}>
              {tier.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', marginBottom: '8px', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => subscribe(tier.id)}
              disabled={loadingTier !== null || !!activeSub}
              style={{
                padding: '13px 18px',
                background: activeSub ? 'var(--gray-l)' : (tier.highlight ? 'var(--teal)' : '#fff'),
                color: activeSub ? 'var(--gray)' : (tier.highlight ? '#fff' : 'var(--teal)'),
                border: tier.highlight ? 'none' : '1.5px solid var(--teal)',
                borderRadius: 'var(--rs)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: (loadingTier !== null || activeSub) ? 'not-allowed' : 'pointer',
                opacity: loadingTier === tier.id ? 0.6 : 1,
              }}
            >
              {activeSub
                ? 'Έχεις ήδη συνδρομή'
                : loadingTier === tier.id ? 'Ανακατεύθυνση...' : 'Επιλογή'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', textAlign: 'center', fontSize: '12px', color: 'var(--gray)', lineHeight: 1.6 }}>
        Όλες οι τιμές περιλαμβάνουν ΦΠΑ. Οι χρεώσεις είναι μη επιστρεπτέες.<br />
        Μπορείς να ακυρώσεις τη συνδρομή ανά πάσα στιγμή — διατηρείς πρόσβαση μέχρι τη λήξη της περιόδου.
      </div>

      <style>{`
        @media(max-width:768px){
          .upgrade-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>⏳ Φόρτωση...</div>}>
      <UpgradeContent />
    </Suspense>
  )
}
