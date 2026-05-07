'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [count, setCount] = useState(0)
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function resetPassword(proId: string) {
    setActionMsg(m => ({ ...m, [proId]: '⏳' }))
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: proId, action: 'reset_password' }),
    })
    const json = await res.json()
    setActionMsg(m => ({ ...m, [proId]: json.ok ? '✅ Εστάλη!' : '❌ ' + json.error }))
    setTimeout(() => setActionMsg(m => ({ ...m, [proId]: '' })), 4000)
  }

  async function deletePro(proId: string) {
    setActionMsg(m => ({ ...m, [proId]: '⏳' }))
    setConfirmDelete(null)
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: proId }),
    })
    const json = await res.json()
    if (json.ok) {
      setPros(p => p.filter(x => x.id !== proId))
    } else {
      setActionMsg(m => ({ ...m, [proId]: '❌ ' + json.error }))
      setTimeout(() => setActionMsg(m => ({ ...m, [proId]: '' })), 4000)
    }
  }

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
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Διαγραφή επαγγελματία;</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
              Αυτή η ενέργεια είναι μη αναστρέψιμη. Ο χρήστης και όλα τα δεδομένα του θα διαγραφούν οριστικά.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                Ακύρωση
              </button>
              <button onClick={() => deletePro(confirmDelete)} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Ναι, διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}

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
                {['Όνομα', 'Κατηγορία', 'Πόλη', 'Εγγραφή', 'Επαλήθευση', ''].map(h => (
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
                    <td style={{ padding: '12px 16px' }}>
                      {actionMsg[pro.id] ? (
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{actionMsg[pro.id]}</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => router.push(`/admin/pros/${pro.id}`)}
                            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => resetPassword(pro.id)}
                            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}
                          >
                            🔑 Reset
                          </button>
                          <button
                            onClick={() => setConfirmDelete(pro.id)}
                            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                          >
                            🗑
                          </button>
                        </div>
                      )}
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
