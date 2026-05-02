'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <>
      {/* Etymology bar */}
      <div style={{ textAlign: 'center', background: 'var(--gray-l)', padding: '.6rem', fontSize: '12px', color: 'var(--gray)' }}>
        <strong style={{ color: 'var(--teal)' }}>kydo</strong> — από το αρχαιοελληνικό «κήδομαι» · φροντίζω · μεριμνώ
      </div>

      {/* Hero */}
      <div style={{ padding: '5rem 2rem 4rem', textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'var(--teal-l)', color: 'var(--teal)',
          fontSize: '12px', fontWeight: 600, padding: '6px 14px',
          borderRadius: '20px', marginBottom: '1.5rem',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--teal)">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Kydo Verified · Φροντίδα με Απόδειξη
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.2rem', letterSpacing: '-1px' }}>
          Βρες τον κατάλληλο άνθρωπο για{' '}
          <span style={{ color: 'var(--teal)' }}>τους δικούς σου</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--gray)', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Η πρώτη πλατφόρμα στην Ελλάδα με 100% επαληθευμένους επαγγελματίες κατ' οίκον φροντίδας.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => router.push('/search')} style={{
            background: 'var(--teal)', color: '#fff', padding: '14px 28px',
            borderRadius: '24px', fontWeight: 700, fontSize: '15px',
            cursor: 'pointer', border: 'none',
          }}>
            Ξεκίνα δωρεάν
          </button>
          <button onClick={() => router.push('/search')} style={{
            background: '#fff', color: 'var(--teal)', padding: '14px 28px',
            borderRadius: '24px', fontSize: '15px', cursor: 'pointer',
            border: '2px solid var(--teal)', fontWeight: 600,
          }}>
            Εγγραφή ως επαγγελματίας
          </button>
        </div>
      </div>

      {/* Trust bar */}
      <div style={{
        borderTop: '1px solid var(--gray-m)', borderBottom: '1px solid var(--gray-m)',
        padding: '1rem 2rem', display: 'flex', gap: '2rem',
        justifyContent: 'center', flexWrap: 'wrap',
      }}>
        {['Kydo Verified', 'Ελεγμένο ποινικό μητρώο', 'Πιστοποιημένα πτυχία', '⚡ Express 2–4 ώρες', '€19 — Όχι €700'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray)', fontWeight: 500 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--teal2)', flexShrink: 0 }} />
            {t}
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: '4rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '.5rem', letterSpacing: '-.5px' }}>
          Γιατί Kydo;
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--gray)', fontSize: '14px', marginBottom: '3rem' }}>
          Το TripAdvisor της κατ' οίκον φροντίδας
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' }}>
          {[
            { icon: '✓', title: 'Kydo Verified', desc: 'Επαλήθευση ταυτότητας, πτυχίων και ποινικού μητρώου.' },
            { icon: '📍', title: 'Τοποθεσία & Απόσταση', desc: 'Αναζήτηση με βάση περιοχή και μέγιστη απόσταση.' },
            { icon: '🗓', title: 'Ωράριο & Ημέρες', desc: 'Φίλτρα για ημέρες, βάρδιες, διαμονή εντός.' },
            { icon: '⚡', title: 'Kydo Express', desc: 'Επείγον; Επαγγελματίας εντός 2–4 ωρών.' },
            { icon: '★', title: 'Αξιολογήσεις', desc: 'Πραγματικές κριτικές από οικογένειες.' },
            { icon: '💶', title: '€19 — Όχι €700', desc: 'Τα γραφεία παίρνουν 1 μισθό. Το Kydo €19.' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'var(--gray-l)', borderRadius: 'var(--r)',
              padding: '1.5rem', transition: 'all .2s', cursor: 'default',
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '.8rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--gray)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--gray-l)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '.5rem', letterSpacing: '-.5px' }}>
            Πώς λειτουργεί
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2.5rem' }}>
            {[
              { n: '1', title: 'Αναζήτησε', desc: 'Περιοχή, απόσταση, εξειδίκευση, ωράριο.' },
              { n: '2', title: 'Διάβασε', desc: 'Αξιολογήσεις + Kydo Verified badge.' },
              { n: '3', title: 'Unlock €19', desc: 'Ξεκλείδωσε τα στοιχεία των καλύτερων.' },
              { n: '4', title: 'Αξιολόγησε', desc: 'Βοήθα την επόμενη οικογένεια.' },
            ].map(s => (
              <div key={s.n} style={{
                background: '#fff', borderRadius: 'var(--r)', padding: '1.5rem',
                flex: 1, minWidth: '160px', maxWidth: '200px',
                textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,.06)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--teal)', color: '#fff', fontWeight: 800,
                  fontSize: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 12px',
                }}>{s.n}</div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '5px' }}>{s.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--gray)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: 'var(--teal)', color: '#fff', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '.8rem', letterSpacing: '-.5px' }}>
          Kydo — Φροντίδα με Απόδειξη
        </h2>
        <p style={{ opacity: .85, marginBottom: '1.5rem', fontSize: '15px' }}>
          500+ Kydo Verified επαγγελματίες σε Αθήνα και κύρια αστικά κέντρα.
        </p>
        <button onClick={() => router.push('/search')} style={{
          background: '#fff', color: 'var(--teal)', padding: '14px 32px',
          borderRadius: '24px', fontWeight: 700, fontSize: '15px',
          cursor: 'pointer', border: 'none',
        }}>
          Ξεκίνα δωρεάν
        </button>
      </div>

      {/* Footer */}
      <footer style={{ background: '#111', color: '#888', padding: '2rem', textAlign: 'center', fontSize: '12px', lineHeight: 2 }}>
        <strong style={{ color: '#fff', fontSize: '15px', fontWeight: 800, display: 'block', marginBottom: '.3rem', letterSpacing: '-.5px' }}>
          kydo.
        </strong>
        από το «κήδομαι» — φροντίζω · kydo.gr · info@kydo.gr<br />
        <a href="/terms" style={{ color: '#aaa', textDecoration: 'underline' }}>Όροι Χρήσης</a>
        {' · '}
        <a href="/privacy" style={{ color: '#aaa', textDecoration: 'underline' }}>Πολιτική Απορρήτου</a>
      </footer>
    </>
  )
}