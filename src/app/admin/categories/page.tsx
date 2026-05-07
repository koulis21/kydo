'use client'

import { useEffect, useState } from 'react'

type Category = {
  id: number
  name: string
  active: boolean
  sort_order: number
}

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/categories')
    const json = await res.json()
    setCats(json.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function flash(m: string) {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  async function addCategory() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const json = await res.json()
    if (json.data) { setNewName(''); load(); flash('✅ Προστέθηκε!') }
    else flash('❌ ' + json.error)
    setAdding(false)
  }

  async function toggleActive(cat: Category) {
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, active: !cat.active }),
    })
    load()
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim() }),
    })
    const json = await res.json()
    if (json.ok) { setEditId(null); load(); flash('✅ Αποθηκεύτηκε!') }
    else flash('❌ ' + json.error)
  }

  async function deleteCategory(id: number) {
    if (!confirm('Διαγραφή κατηγορίας; Οι επαγγελματίες που την έχουν δεν θα επηρεαστούν.')) return
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
    flash('🗑 Διαγράφηκε')
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '700px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>🏷️ Κατηγορίες</h1>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '2rem' }}>
        Διαχείριση κατηγοριών επαγγελματιών που εμφανίζονται στην αναζήτηση και στις εγγραφές.
      </p>

      {/* Add new */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#0f172a' }}>Προσθήκη νέας κατηγορίας</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="π.χ. Παιδίατρος"
            style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={addCategory}
            disabled={adding || !newName.trim()}
            style={{ padding: '9px 18px', background: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.6 : 1 }}
          >
            + Προσθήκη
          </button>
        </div>
        {msg && <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>{msg}</div>}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ color: '#94a3b8' }}>Φόρτωση...</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {cats.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px',
              borderBottom: i < cats.length - 1 ? '1px solid #f1f5f9' : 'none',
              opacity: cat.active ? 1 : 0.5,
            }}>
              {/* Active toggle */}
              <button
                onClick={() => toggleActive(cat)}
                title={cat.active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: cat.active ? '#0d9488' : '#cbd5e1', position: 'relative', flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '2px', width: '16px', height: '16px',
                  borderRadius: '50%', background: '#fff',
                  left: cat.active ? '18px' : '2px', transition: 'left 0.2s',
                }} />
              </button>

              {/* Name / edit */}
              {editId === cat.id ? (
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                  autoFocus
                  style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #0d9488', fontSize: '14px', outline: 'none' }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{cat.name}</span>
              )}

              <span style={{ fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>#{cat.sort_order}</span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {editId === cat.id ? (
                  <>
                    <button onClick={() => saveEdit(cat.id)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                      Αποθ.
                    </button>
                    <button onClick={() => setEditId(null)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                      Άκυρο
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditId(cat.id); setEditName(cat.name) }} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', cursor: 'pointer' }}>
                      ✏️
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {cats.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Δεν υπάρχουν κατηγορίες</div>
          )}
        </div>
      )}
    </div>
  )
}
