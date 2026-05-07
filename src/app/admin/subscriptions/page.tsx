'use client'

import { useEffect, useState } from 'react'

type Sub = {
  id: string
  user_id: string
  plan: string
  status: string
  created_at: string
  current_period_end: string | null
  profiles: { full_name: string } | { full_name: string }[]
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:   { bg: '#dcfce7', color: '#166534' },
  canceled: { bg: '#fee2e2', color: '#991b1b' },
  past_due: { bg: '#fef3c7', color: '#92400e' },
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('active')
  const [count, setCount] = useState(0)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const res = await fetch(`/api/admin/subscriptions?${params}`)
    const json = await res.json()
    setSubs(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  function getName(sub: Sub) {
    const p = sub.profiles
    if (Array.isArray(p)) return p[0]?.full_name || '—'
    return (p as any)?.full_name || '—'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          💳 Συνδρομές <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>({count})</span>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem' }}>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff' }}
        >
          <option value="">Όλες</option>
          <option value="active">Ενεργές</option>
          <option value="canceled">Ακυρωμένες</option>
          <option value="past_due">Εκπρόθεσμες</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem' }}>Φόρτωση...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Χρήστης', 'Plan', 'Status', 'Έναρξη', 'Λήξη'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((sub, i) => {
                const s = statusStyle[sub.status] || { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={sub.id} style={{ borderBottom: i < subs.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{getName(sub)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>{sub.plan}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', fontWeight: 600, background: s.bg, color: s.color }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(sub.created_at).toLocaleDateString('el-GR')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('el-GR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {subs.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Δεν βρέθηκαν συνδρομές</div>
          )}
        </div>
      )}
    </div>
  )
}
