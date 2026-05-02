'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('kydo_cookie')) setVisible(true)
  }, [])

  function accept(all: boolean) {
    localStorage.setItem('kydo_cookie', all ? 'ok' : 'min')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--text)', color: '#fff',
      padding: '1rem 1.5rem', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', zIndex: 1000, flexWrap: 'wrap', fontSize: '13px'
    }}>
      <span>
        Χρησιμοποιούμε cookies για τη λειτουργία του site.{' '}
        <Link href="/privacy" style={{ color: 'var(--teal2)', fontWeight: 600 }}>
          Πολιτική Απορρήτου
        </Link>
      </span>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button onClick={() => accept(false)} style={{
          background: 'transparent', color: '#aaa',
          border: '1px solid #555', padding: '9px 20px',
          borderRadius: '24px', fontSize: '13px', cursor: 'pointer'
        }}>
          Μόνο απαραίτητα
        </button>
        <button onClick={() => accept(true)} style={{
          background: 'var(--white)', color: 'var(--text)',
          border: 'none', padding: '9px 20px',
          borderRadius: '24px', fontSize: '13px',
          fontWeight: 700, cursor: 'pointer'
        }}>
          Αποδοχή
        </button>
      </div>
    </div>
  )
}