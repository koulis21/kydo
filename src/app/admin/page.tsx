'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Stats = {
  totalUsers: number
  totalFamilies: number
  totalPros: number
  pendingVerifications: number
  activeSubscriptions: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
  }, [])

  const cards = stats ? [
    { label: 'Σύνολο χρηστών', value: stats.totalUsers, icon: '👥', color: '#0d9488', href: '/admin/users' },
    { label: 'Οικογένειες', value: stats.totalFamilies, icon: '🏠', color: '#3b82f6', href: '/admin/users?role=family' },
    { label: 'Επαγγελματίες', value: stats.totalPros, icon: '🩺', color: '#8b5cf6', href: '/admin/pros' },
    { label: 'Εκκρεμείς επαλ.', value: stats.pendingVerifications, icon: '🔍', color: '#f59e0b', href: '/admin/verifications' },
    { label: 'Ενεργές συνδρομές', value: stats.activeSubscriptions, icon: '💳', color: '#10b981', href: '/admin/subscriptions' },
  ] : []

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', color: '#0f172a' }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '14px' }}>
        {new Date().toLocaleDateString('el-GR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Φόρτωση στατιστικών...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
          {cards.map(card => (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '1.4rem', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>{card.icon}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>{card.label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
