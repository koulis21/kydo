'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  full_name: string
  email: string
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
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  async function resetPassword(userId: string) {
    setActionMsg(m => ({ ...m, [userId]: '⏳' }))
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action: 'reset_password' }),
    })
    const json = await res.json()
    setActionMsg(m => ({ ...m, [userId]: json.ok ? '✅ Εστάλη email!' : '❌ ' + json.error }))
    setTimeout(() => setActionMsg(m => ({ ...m, [userId]: '' })), 4000)
  }

  async function deleteUser(userId: string) {
    setActionMsg(m => ({ ...m, [userId]: '⏳' }))
    setConfirmDelete(null)
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    const json = await res.json()
    if (json.ok) {
      setUsers(u => u.filter(x => x.id !== userId))
    } else {
      setActionMsg(m => ({ ...m, [userId]: '❌ ' + json.error }))
      setTimeout(() => setActionMsg(m => ({ ...m, [userId]: '' })), 4000)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Διαγραφή χρήστη;</div>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '1.5rem' }}>
              Αυτή η ενέργεια είναι μη αναστρέψιμη. Ο χρήστης και όλα τα δεδομένα του θα διαγραφούν οριστικά.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                Ακύρωση
              </button>
              <button onClick={() => deleteUser(confirmDelete)} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Ναι, διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}

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
                {['Όνομα', 'Email', 'Τύπος', 'Πόλη', 'Εγγραφή', 'Ενέργειες'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{u.email || '—'}</td>
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
                  <td style={{ padding: '12px 16px' }}>
                    {actionMsg[u.id] ? (
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{actionMsg[u.id]}</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => resetPassword(u.id)}
                          title="Αποστολή email επαναφοράς κωδικού"
                          style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#0d9488', cursor: 'pointer', fontWeight: 600 }}
                        >
                          🔑 Reset pwd
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u.id)}
                          title="Διαγραφή χρήστη"
                          style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
                        >
                          🗑 Διαγραφή
                        </button>
                      </div>
                    )}
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
