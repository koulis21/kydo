'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  userId: string
  /** Field name on the professionals table, e.g. 'cv_path' */
  field: 'cv_path' | 'diploma_path' | 'cpr_cert_path'
  /** Filename in the user's folder, e.g. 'cv.pdf' */
  filename: string
  label: string
  hint?: string
  currentPath?: string | null
  onUpdate: (path: string | null) => void
}

const DOC_BUCKET = 'pro-documents'
const MAX_BYTES = 5 * 1024 * 1024

export default function DocumentUpload({ userId, field, filename, label, hint, currentPath, onUpdate }: Props) {
  const sb = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setBusy(true)
    try {
      if (file.size > MAX_BYTES) throw new Error('Μέγιστο 5MB')
      const path = `${userId}/${filename}`
      const { error: upErr } = await sb.storage.from(DOC_BUCKET).upload(path, file, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      })
      if (upErr) throw upErr

      const { error: dbErr } = await sb.from('professionals').update({ [field]: path }).eq('id', userId)
      if (dbErr) throw dbErr

      onUpdate(path)
    } catch (err: any) {
      setError(err.message || 'Σφάλμα ανεβάσματος')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!currentPath) return
    setBusy(true)
    setError('')
    try {
      await sb.storage.from(DOC_BUCKET).remove([currentPath])
      const { error: dbErr } = await sb.from('professionals').update({ [field]: null }).eq('id', userId)
      if (dbErr) throw dbErr
      onUpdate(null)
    } catch (err: any) {
      setError(err.message || 'Σφάλμα διαγραφής')
    } finally {
      setBusy(false)
    }
  }

  async function handleDownload() {
    if (!currentPath) return
    setDownloading(true)
    try {
      const { data, error: dlErr } = await sb.storage.from(DOC_BUCKET).createSignedUrl(currentPath, 60)
      if (dlErr) throw dlErr
      window.open(data.signedUrl, '_blank')
    } catch (err: any) {
      setError(err.message || 'Σφάλμα')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--gray-m)', borderRadius: 'var(--rs)', padding: '1rem 1.2rem', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
            {label} {currentPath && <span style={{ color: 'var(--teal)', fontSize: '12px', marginLeft: '4px' }}>✓ Ανέβηκε</span>}
          </div>
          {hint && <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{hint}</div>}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept="application/pdf,image/*" onChange={handleFile} style={{ display: 'none' }} />
          {currentPath && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy || downloading}
              style={{ padding: '7px 12px', background: '#fff', color: 'var(--teal)', border: '1.5px solid var(--teal)', borderRadius: 'var(--rs)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              {downloading ? '...' : '👁 Δες'}
            </button>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{ padding: '7px 12px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '12px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Ανέβασμα...' : currentPath ? 'Αντικατάσταση' : 'Ανέβασμα'}
          </button>
          {currentPath && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              style={{ padding: '7px 12px', background: '#fff', color: 'var(--red)', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '12px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Αφαίρεση
            </button>
          )}
        </div>
      </div>
      {error && <div className="msg msg-error" style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>}
    </div>
  )
}
