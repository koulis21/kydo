'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type PendingPro = {
  id: string
  category: string
  registry_number?: string
  diploma_path?: string
  cv_path?: string
  cpr_cert_path?: string
  verification_requested_at: string
  profiles?: { full_name: string }[]
}

export default function AdminVerificationsPage() {
  const router = useRouter()
  const sb = createClient()
  const [pending, setPending] = useState<PendingPro[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<Record<string, string>>({})

  useEffect(() => {
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/'); return }
      const { data: profile } = await sb.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!profile?.is_admin) { router.push('/'); return }
      const { data } = await sb
        .from('professionals')
        .select('id, category, registry_number, diploma_path, cv_path, cpr_cert_path, verification_requested_at, profiles(full_name)')
        .eq('verification_status', 'pending')
        .order('verification_requested_at', { ascending: true })
      setPending((data as PendingPro[]) || [])
      setLoading(false)
    })
  }, [])

  async function handleAction(proId: string, action: 'approve' | 'reject') {
    setMsg(m => ({ ...m, [proId]: '⏳ Γίνεται επεξεργασία...' }))
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professional_id: proId, action, notes: notes[proId] || '' }),
    })
    const json = await res.json()
    if (json.ok) {
      setMsg(m => ({ ...m, [proId]: action === 'approve' ? '✅ Εγκρίθηκε!' : '❌ Απορρίφθηκε!' }))
      setPending(p => p.filter(x => x.id !== proId))
    } else {
      setMsg(m => ({ ...m, [proId]: 'Σφάλμα: ' + json.error }))
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Φόρτωση...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
        🔍 Αιτήματα Επαλήθευσης
        {pending.length > 0 && (
          <span style={{ marginLeft: '10px', background: '#ef4444', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '14px' }}>
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)', border: '1px dashed var(--gray-m)', borderRadius: 'var(--r)' }}>
          Δεν υπάρχουν εκκρεμή αιτήματα ✓
        </div>
      ) : (
        pending.map(pro => (
          <div key={pro.id} style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--r)', padding: '1.2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{Array.isArray(pro.profiles) ? pro.profiles[0]?.full_name : (pro.profiles as any)?.full_name || '—'}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray)' }}>{pro.category}</div>
                {pro.registry_number && <div style={{ fontSize: '12px', color: 'var(--gray)' }}>Μητρώο: {pro.registry_number}</div>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {new Date(pro.verification_requested_at).toLocaleDateString('el-GR')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {pro.diploma_path && <a href={pro.diploma_path} target="_blank" rel="noreferrer" style={{ fontSize: '12px', background: 'var(--teal-l)', color: 'var(--teal)', padding: '4px 10px', borderRadius: '20px', textDecoration: 'none' }}>📄 Πτυχίο</a>}
              {pro.cv_path && <a href={pro.cv_path} target="_blank" rel="noreferrer" style={{ fontSize: '12px', background: 'var(--teal-l)', color: 'var(--teal)', padding: '4px 10px', borderRadius: '20px', textDecoration: 'none' }}>📄 CV</a>}
              {pro.cpr_cert_path && <a href={pro.cpr_cert_path} target="_blank" rel="noreferrer" style={{ fontSize: '12px', background: 'var(--teal-l)', color: 'var(--teal)', padding: '4px 10px', borderRadius: '20px', textDecoration: 'none' }}>📄 CPR</a>}
              {!pro.diploma_path && !pro.cv_path && !pro.cpr_cert_path && <span style={{ fontSize: '12px', color: 'var(--gray)' }}>Χωρίς έγγραφα</span>}
            </div>

            <textarea
              placeholder="Σημειώσεις (προαιρετικά, εμφανίζονται στον επαγγελματία αν απορριφθεί)"
              value={notes[pro.id] || ''}
              onChange={e => setNotes(n => ({ ...n, [pro.id]: e.target.value }))}
              style={{ width: '100%', padding: '8px', borderRadius: 'var(--rs)', border: '1px solid var(--gray-m)', fontSize: '13px', resize: 'vertical', minHeight: '60px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleAction(pro.id, 'approve')}
                style={{ padding: '9px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ Έγκριση
              </button>
              <button
                onClick={() => handleAction(pro.id, 'reject')}
                style={{ padding: '9px 20px', background: '#fff', color: '#ef4444', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                ✕ Απόρριψη
              </button>
            </div>
            {msg[pro.id] && <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>{msg[pro.id]}</div>}
          </div>
        ))
      )}
    </div>
  )
}
