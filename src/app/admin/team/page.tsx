'use client'

import { useEffect, useState } from 'react'

type TeamMember = {
  id: string
  full_name: string
  admin_role: string
  created_at: string
}

export default function AdminTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'mod' | 'admin' | 'super_admin'>('mod')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/team')
    const json = await res.json()
    setTeam(json.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateRole(userId: string, role: string | null) {
    setSaving(true)
    const res = await fetch('/api/admin/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, admin_role: role }),
    })
    const json = await res.json()
    if (json.ok) {
      setMsg('✅ Αποθηκεύτηκε')
      load()
    } else {
      setMsg('❌ ' + json.error)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function addMember() {
    if (!newEmail.trim()) return
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim(), admin_role: newRole }),
    })
    const json = await res.json()
    if (json.ok) {
      setMsg('✅ Προστέθηκε!')
      setNewEmail('')
      load()
    } else {
      setMsg('❌ ' + json.error)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const roleColors: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: '#fef3c7', color: '#92400e' },
    admin:       { bg: '#dbeafe', color: '#1d4ed8' },
    mod:         { bg: '#f0fdf4', color: '#166534' },
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>🛡️ Ομάδα διαχείρισης</h1>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '2rem' }}>
        Διαχείριση admins και moderators. Μόνο super_admin μπορεί να αλλάξει roles.
      </p>

      {/* Roles legend */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { role: 'super_admin', desc: 'Πλήρης πρόσβαση' },
          { role: 'admin', desc: 'Verifications + users' },
          { role: 'mod', desc: 'Μόνο verifications' },
        ].map(({ role, desc }) => {
          const s = roleColors[role]
          return (
            <div key={role} style={{ padding: '8px 14px', borderRadius: '8px', background: s.bg, border: `1px solid ${s.color}20` }}>
              <span style={{ fontWeight: 700, color: s.color, fontSize: '13px' }}>{role}</span>
              <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '6px' }}>— {desc}</span>
            </div>
          )
        })}
      </div>

      {/* Current team */}
      {loading ? (
        <div style={{ color: '#94a3b8' }}>Φόρτωση...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Όνομα', 'Role', 'Ενέργεια'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((member, i) => {
                const s = roleColors[member.admin_role] || { bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={member.id} style={{ borderBottom: i < team.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{member.full_name || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '20px', fontWeight: 700, background: s.bg, color: s.color }}>
                        {member.admin_role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => updateRole(member.id, null)}
                        disabled={saving}
                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                      >
                        Αφαίρεση
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {team.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Δεν υπάρχουν μέλη ομάδας</div>
          )}
        </div>
      )}

      {/* Add new member */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>Προσθήκη μέλους</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>
          Βάλε το email του χρήστη που θέλεις να προσθέσεις.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="email@example.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', flex: 1, minWidth: '280px', outline: 'none' }}
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as any)}
            style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#fff' }}
          >
            <option value="mod">mod</option>
            <option value="admin">admin</option>
            <option value="super_admin">super_admin</option>
          </select>
          <button
            onClick={addMember}
            disabled={saving || !newEmail.trim()}
            style={{ padding: '9px 18px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            Προσθήκη
          </button>
        </div>
        {msg && <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600 }}>{msg}</div>}
      </div>
    </div>
  )
}
