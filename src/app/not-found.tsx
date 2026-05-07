import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', padding: '2rem', flexDirection: 'column', textAlign: 'center',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Η σελίδα δεν βρέθηκε
      </div>
      <div style={{ color: '#64748b', fontSize: '15px', marginBottom: '2rem', maxWidth: '400px' }}>
        Η σελίδα που ψάχνεις δεν υπάρχει ή έχει μετακινηθεί.
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" style={{
          padding: '12px 24px', background: '#0d9488', color: '#fff',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
        }}>
          ← Αρχική
        </Link>
        <Link href="/search" style={{
          padding: '12px 24px', background: '#fff', color: '#0d9488',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '15px',
          border: '1.5px solid #0d9488',
        }}>
          Αναζήτηση επαγγελματιών
        </Link>
      </div>
    </div>
  )
}
