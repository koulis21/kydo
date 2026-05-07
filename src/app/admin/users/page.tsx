'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  full_name: string
  role: string
  admin_role: string | null
  created_at: string
  city: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [count, setCount] = useState(0)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    const res = await fetch(`/api/admin/users?${params}`)
    const json = await res.json()
    setUsers(json.data || [])
    setCount(json.count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, role])

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
          👥 Users <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748b' }}>({count})</span>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.2rem' }}>
        <input
          placeholder="Αναζήτηση ονόματος..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', flex: 1, outline: 'none' }}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff' }}
        >
          <option value="">Όλοι</option>
          <option value="family">Οικογένειες</option>
          <option value="professional">Επαγγελματίες</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem' }}>Φόρτωση...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Όνομα', 'Τύπος', 'Πόλη', 'Εγγραφή', 'Admin role'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '12px', padding: '3px 9px', borderRadius: '20px', fontWeight: 600,
                      background: u.role === 'professional' ? '#ede9fe' : '#dcfce7',
                      color: u.role === 'professional' ? '#7c3aed' : '#166534',
                    }}>
                      {u.role === 'professional' ? 'Pro' : 'Family'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.city || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString('el-GR')}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: u.admin_role ? '#0d9488' : '#cbd5e1', fontWeight: u.admin_role ? 700 : 400 }}>
                    {u.admin_role || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Δεν βρέθηκαν χρήστες</div>
          )}
        </div>
      )}
    </div>
  )
}
