'use client'

import type { VerificationState } from '@/lib/verification'

type Props = {
  state: VerificationState
  /** Compact mode = ring + count. Full mode = ring + checklist. */
  variant?: 'full' | 'compact'
}

export default function VerificationPanel({ state, variant = 'full' }: Props) {
  const { checkpoints, done, total, percent } = state
  const stroke = 6
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (percent / 100) * circ

  const ring = (
    <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--gray-l)" strokeWidth={stroke} />
        <circle
          cx="45" cy="45" r={radius}
          fill="none"
          stroke={percent >= 80 ? 'var(--teal)' : percent >= 50 ? '#f59e0b' : '#e63946'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset .4s' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>
        <span>{percent}%</span>
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--gray)', marginTop: '2px' }}>{done}/{total}</span>
      </div>
    </div>
  )

  if (variant === 'compact') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {ring}
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '2px' }}>Επαλήθευση</div>
          <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
            {percent === 100 ? 'Πλήρες προφίλ ✓' : `${total - done} ακόμα βήμα${total - done === 1 ? '' : 'τα'}`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '1rem' }}>
        Επίπεδο επαλήθευσης
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '1.2rem' }}>
        {ring}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.5 }}>
            {percent === 100
              ? '🎉 Όλα τα βήματα ολοκληρώθηκαν.'
              : `Συμπλήρωσε τα παρακάτω για να ενισχύσεις την εμπιστοσύνη των οικογενειών.`}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '8px' }}>
        {checkpoints.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: c.done ? 'var(--text)' : 'var(--gray)', padding: '6px 0' }}>
            <span style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: c.done ? 'var(--teal)' : 'var(--gray-l)',
              color: c.done ? '#fff' : 'var(--gray)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              flexShrink: 0,
            }}>{c.done ? '✓' : '○'}</span>
            <span style={{ textDecoration: c.done ? 'none' : 'none' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
