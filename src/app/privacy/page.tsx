'use client'

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.4rem', letterSpacing: '-.5px' }}>Πολιτική Απορρήτου</h1>
      <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '2rem' }}>Τελευταία ενημέρωση: Μάιος 2026</div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>1. Υπεύθυνος</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>Kydo — info@kydo.gr. GDPR (ΕΕ) 2016/679.</p>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>2. Δεδομένα</h2>
      <ul style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, paddingLeft: '1.3rem' }}>
        <li>Όνομα, email, τηλέφωνο</li>
        <li>Επαγγελματικά στοιχεία</li>
      </ul>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>3. Δικαιώματα</h2>
      <ul style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, paddingLeft: '1.3rem' }}>
        <li>Πρόσβαση, διόρθωση, διαγραφή — info@kydo.gr</li>
      </ul>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>4. Cookies</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>Μόνο απαραίτητα cookies. Χωρίς tracking.</p>
    </div>
  )
}