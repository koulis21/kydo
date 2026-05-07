'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Pro = {
  id: string
  category: string
  verification_status: string
  is_verified: boolean
  created_at: string
  profiles: { full_name: string; city: string } | { full_name: string; city: string }[]
}

const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
  none:     { label: 'Καμία',     bg: '#f1f5f9', color: '#64748b' },
  pending:  { label: 'Εκκρεμεί', bg: '#fef3c7', color: '#92400e' },
  approved: { label: 'Εγκρίθηκε',bg: '#dcfce7', color: '#166534' },
  rejected: { label: 'Απορρίφθηκε', bg: '#fee2e2', color: '#991b1b' },
}

export default function AdminProsPage() {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [count, setCount] = useState(0)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const res = await fetch(`/api/admin/pros?${params}`)
    const json = await res.json()
    setPros(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [status])

  function getName(pro: Pro) {
    const p = pro.profiles
    if (Array.isArray(p)) return p[0]?.full_name || '—'
    return (p as any)?.full_name || '—'
  }

  function getCity(pro: Pro) {
    const p = pro.profiles
    if (Array.isArray(p)) return p[0]?.city || '—'
    return (p as any)?.city || '—'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          🩺 Επαγγελματίες <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>({count})</span>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem' }}>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff' }}
        >
          <option value="">Όλοι</option>
          <option value="pending">Εκκρεμείς</option>
          <option value="approved">Εγκεκριμένοι</option>
          <option value="rejected">Απορριφθέντες</option>
          <option value="none">Χωρίς αίτημα</option>
        </select>
        {status === 'pending' && (
          <Link href="/admin/verifications" style={{ padding: '9px 16px', background: '#0d9488', color: '#fff', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}>
            → Διαχείριση επαλήθευσης
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem' }}>Φόρτωση...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Όνομα', 'Κατηγορία', 'Πόλη', 'Εγγραφή', 'Επαλήθευση'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pros.map((pro, i) => {
                const s = statusLabel[pro.verification_status] || statusLabel.none
                return (
                  <tr key={pro.id} style={{ borderBottom: i < pros.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{getName(pro)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{pro.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{getCity(pro)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(pro.created_at).toLocaleDateString('el-GR')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', fontWeight: 600, background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {pros.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Δεν βρέθηκαν επαγγελματίες</div>
          )}
        </div>
      )}
    </div>
  )
}
