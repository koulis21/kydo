'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TIERS, type SubscriptionTier, type TierInfo } from '@/lib/stripe-config'

type ConfirmAction =
  | { type: 'subscribe'; tier: SubscriptionTier }
  | { type: 'change'; tier: SubscriptionTier; from: SubscriptionTier }
  | { type: 'cancel' }
  | { type: 'reactivate' }
  | null

function UpgradeContent() {
  const router = useRouter()
  const params = useSearchParams()
  const sb = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<'family' | 'professional' | ''>('')
  const [activeSub, setActiveSub] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [msg, setMsg] = useState<string>('')
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('')

  useEffect(() => {
    loadUser()

    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false) }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  async function loadUser() {
    const { data: { session } } = await sb.auth.getSession()
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
  }

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

  function handleTierClick(tier: SubscriptionTier) {
    if (busy) return
    if (!activeSub) {
      setConfirmAction({ type: 'subscribe', tier })
    } else if (activeSub.tier === tier) {
      // already on this tier, no-op
    } else {
      setConfirmAction({ type: 'change', tier, from: activeSub.tier })
    }
  }

  async function executeConfirm() {
    if (!confirmAction) return
    setBusy(true)
    try {
      if (confirmAction.type === 'subscribe') {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: confirmAction.tier }),
        })
        const data = await res.json()
        if (data.url) { window.location.href = data.url; return }
        throw new Error(data.error || 'unknown')
      } else if (confirmAction.type === 'change') {
        const res = await fetch('/api/change-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: confirmAction.tier }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'unknown')
        setMsg(`✓ Άλλαξες σε ${TIERS[confirmAction.tier].label}. Η αλλαγή ισχύει άμεσα — η χρέωση γίνεται proration.`)
        setMsgType('success')
        await loadUser()
      } else if (confirmAction.type === 'cancel') {
        const res = await fetch('/api/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'unknown')
        setMsg('Η συνδρομή ακυρώθηκε. Διατηρείς πρόσβαση μέχρι τη λήξη της περιόδου.')
        setMsgType('success')
        await loadUser()
      } else if (confirmAction.type === 'reactivate') {
        const res = await fetch('/api/cancel-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reactivate: true }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'unknown')
        setMsg('✓ Η συνδρομή επανενεργοποιήθηκε. Θα ανανεωθεί αυτόματα στη λήξη.')
        setMsgType('success')
        await loadUser()
      }
    } catch (err: any) {
      setMsg('Σφάλμα: ' + err.message)
      setMsgType('error')
    } finally {
      setBusy(false)
      setConfirmAction(null)
    }
  }

  async function manageBilling() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/billing-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      throw new Error(data.error || 'unknown')
    } catch (err: any) {
      setMsg('Σφάλμα: ' + err.message); setMsgType('error'); setBusy(false)
    }
  }

  if (!user) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>⏳ Φόρτωση...</div>

  const visibleTiers = (Object.values(TIERS) as TierInfo[]).filter(t =>
    role === 'professional' ? t.audience === 'pro' : t.audience === 'family'
  )

  const periodEnd = activeSub
    ? new Date(activeSub.current_period_end).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

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

      {/* Active subscription panel */}
      {activeSub && (
        <div style={{
          background: activeSub.cancel_at_period_end ? 'var(--amber-l)' : 'var(--teal-l)',
          border: `1px solid ${activeSub.cancel_at_period_end ? '#e8c97a' : '#b8e8d8'}`,
          borderRadius: 'var(--r)',
          padding: '1.2rem 1.4rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: activeSub.cancel_at_period_end ? 'var(--amber)' : 'var(--teal)', marginBottom: '4px' }}>
            {activeSub.cancel_at_period_end
              ? `⚠️ Η συνδρομή σου λήγει στις ${periodEnd}`
              : `✓ Ενεργή συνδρομή: ${TIERS[activeSub.tier as SubscriptionTier]?.label}`}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '12px' }}>
            {activeSub.cancel_at_period_end
              ? 'Δεν θα ανανεωθεί αυτόματα. Διατηρείς πλήρη πρόσβαση μέχρι τη λήξη.'
              : `Επόμενη ανανέωση: ${periodEnd}`}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={manageBilling} disabled={busy} style={{ padding: '10px 18px', background: '#fff', color: 'var(--teal)', border: '1.5px solid var(--teal)', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
              💳 Διαχείριση χρέωσης
            </button>
            {activeSub.cancel_at_period_end ? (
              <button onClick={() => setConfirmAction({ type: 'reactivate' })} disabled={busy} style={{ padding: '10px 18px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                ↻ Επαναφορά συνδρομής
              </button>
            ) : (
              <button onClick={() => setConfirmAction({ type: 'cancel' })} disabled={busy} style={{ padding: '10px 18px', background: 'transparent', color: 'var(--red)', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}>
                Ακύρωση συνδρομής
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleTiers.length}, 1fr)`, gap: '1.2rem' }} className="upgrade-grid">
        {visibleTiers.map(tier => {
          const isCurrent = activeSub?.tier === tier.id
          const ctaLabel = isCurrent
            ? '✓ Τρέχον πλάνο'
            : activeSub
              ? 'Αλλαγή σε αυτό'
              : 'Επιλογή'
          return (
            <div key={tier.id} style={{
              background: '#fff',
              border: isCurrent ? '2px solid var(--teal)' : tier.highlight ? '2px solid var(--teal)' : '1px solid var(--gray-m)',
              borderRadius: 'var(--r)',
              padding: '1.6rem 1.4rem',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              opacity: isCurrent ? 1 : busy ? 0.6 : 1,
            }}>
              {(tier.highlight || isCurrent) && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--teal)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', letterSpacing: '.3px', whiteSpace: 'nowrap' }}>
                  {isCurrent ? 'ΤΡΕΧΟΝ ΠΛΑΝΟ' : 'ΔΗΜΟΦΙΛΕΣ'}
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
                onClick={() => handleTierClick(tier.id)}
                disabled={busy || isCurrent}
                style={{
                  padding: '13px 18px',
                  background: isCurrent ? 'var(--gray-l)' : (tier.highlight ? 'var(--teal)' : '#fff'),
                  color: isCurrent ? 'var(--gray)' : (tier.highlight ? '#fff' : 'var(--teal)'),
                  border: tier.highlight ? 'none' : '1.5px solid var(--teal)',
                  borderRadius: 'var(--rs)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: (busy || isCurrent) ? 'not-allowed' : 'pointer',
                }}
              >
                {ctaLabel}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', textAlign: 'center', fontSize: '12px', color: 'var(--gray)', lineHeight: 1.6 }}>
        Όλες οι τιμές περιλαμβάνουν ΦΠΑ. Οι χρεώσεις είναι μη επιστρεπτέες.<br />
        Μπορείς να ακυρώσεις τη συνδρομή ανά πάσα στιγμή — διατηρείς πρόσβαση μέχρι τη λήξη της περιόδου.
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <>
          <div onClick={() => !busy && setConfirmAction(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 500 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: 'var(--r)', padding: '1.8rem 1.6rem', maxWidth: '440px', width: 'calc(100% - 2rem)', zIndex: 510, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
            <div style={{ fontSize: '17px', fontWeight: 800, marginBottom: '10px' }}>
              {confirmAction.type === 'subscribe' && `Ενεργοποίηση συνδρομής ${TIERS[confirmAction.tier].label}`}
              {confirmAction.type === 'change' && `Αλλαγή σε ${TIERS[confirmAction.tier].label}`}
              {confirmAction.type === 'cancel' && 'Ακύρωση συνδρομής'}
              {confirmAction.type === 'reactivate' && 'Επαναφορά συνδρομής'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              {confirmAction.type === 'subscribe' && (
                <>Θα ανακατευθυνθείς στο Stripe για ασφαλή πληρωμή <strong>{TIERS[confirmAction.tier].priceLabel} / {TIERS[confirmAction.tier].intervalLabel}</strong>.</>
              )}
              {confirmAction.type === 'change' && (
                <>Αλλάζεις από <strong>{TIERS[confirmAction.from].label}</strong> σε <strong>{TIERS[confirmAction.tier].label}</strong>. Η χρέωση γίνεται proration — πληρώνεις μόνο τη διαφορά για την υπολειπόμενη περίοδο.</>
              )}
              {confirmAction.type === 'cancel' && (
                <>Διατηρείς πλήρη πρόσβαση μέχρι τη λήξη της περιόδου ({periodEnd}). Δεν θα ανανεωθεί αυτόματα μετά. Μπορείς να επαναφέρεις τη συνδρομή ανά πάσα στιγμή πριν τη λήξη.</>
              )}
              {confirmAction.type === 'reactivate' && (
                <>Η συνδρομή σου θα ανανεωθεί αυτόματα στη λήξη της τρέχουσας περιόδου ({periodEnd}). Δεν χρεώνεσαι κάτι τώρα.</>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmAction(null)} disabled={busy} style={{ padding: '10px 18px', background: '#fff', color: 'var(--gray)', border: '1.5px solid var(--gray-m)', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}>
                Άκυρο
              </button>
              <button onClick={executeConfirm} disabled={busy} style={{
                padding: '10px 18px',
                background: confirmAction.type === 'cancel' ? 'var(--red)' : 'var(--teal)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--rs)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}>
                {busy ? 'Επεξεργασία...' : 'Επιβεβαίωση'}
              </button>
            </div>
          </div>
        </>
      )}

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
