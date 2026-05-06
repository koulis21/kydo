'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  userId: string
  currentUrl?: string | null
  initials?: string
  fallbackColor?: string
  onUpdate: (url: string | null) => void
}

const MAX_DIM = 800
const QUALITY = 0.82
const PHOTO_BUCKET = 'pro-photos'

// Resize an image client-side to MAX_DIM × MAX_DIM and re-encode as WebP.
// Keeps file size small (~100-200 KB) without server processing.
async function resizeToWebp(file: File): Promise<Blob> {
  const img = new Image()
  const url = URL.createObjectURL(file)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })

  const ratio = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1)
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  URL.revokeObjectURL(url)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob); else reject(new Error('Canvas encoding failed'))
    }, 'image/webp', QUALITY)
  })
}

export default function PhotoUpload({ userId, currentUrl, initials, fallbackColor = '#888', onUpdate }: Props) {
  const sb = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setBusy(true)
    try {
      if (!file.type.startsWith('image/')) throw new Error('Πρέπει να είναι εικόνα')
      if (file.size > 8 * 1024 * 1024) throw new Error('Μέγιστο 8MB πριν τη συμπίεση')

      const blob = await resizeToWebp(file)
      const path = `${userId}/photo.webp`
      const { error: upErr } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data: pub } = sb.storage.from(PHOTO_BUCKET).getPublicUrl(path)
      // Cache buster so the new image shows immediately
      const url = `${pub.publicUrl}?v=${Date.now()}`

      const { error: dbErr } = await sb.from('professionals').update({ photo_url: url }).eq('id', userId)
      if (dbErr) throw dbErr

      onUpdate(url)
    } catch (err: any) {
      setError(err.message || 'Σφάλμα ανεβάσματος')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setBusy(true)
    setError('')
    try {
      await sb.storage.from(PHOTO_BUCKET).remove([`${userId}/photo.webp`])
      const { error: dbErr } = await sb.from('professionals').update({ photo_url: null }).eq('id', userId)
      if (dbErr) throw dbErr
      onUpdate(null)
    } catch (err: any) {
      setError(err.message || 'Σφάλμα διαγραφής')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
        {currentUrl ? (
          <img src={currentUrl} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }} />
        ) : (
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#fff', border: '3px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}>
            {initials || '?'}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{ padding: '9px 16px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Ανέβασμα...' : currentUrl ? '📷 Αλλαγή φωτογραφίας' : '📷 Ανέβασμα φωτογραφίας'}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              style={{ padding: '9px 16px', background: '#fff', color: 'var(--red)', border: '1.5px solid #f5c6c2', borderRadius: 'var(--rs)', fontSize: '13px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Αφαίρεση
            </button>
          )}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '6px' }}>
          JPEG/PNG/WebP, μέγιστο 8MB. Συμπιέζεται αυτόματα.
        </div>
        {error && <div className="msg msg-error" style={{ marginTop: '8px', fontSize: '13px' }}>{error}</div>}
      </div>
    </div>
  )
}
