'use client'

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.4rem', letterSpacing: '-.5px' }}>Όροι Χρήσης</h1>
      <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '2rem' }}>Τελευταία ενημέρωση: Μάιος 2026</div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>1. Αποδοχή όρων</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>Με τη χρήση της πλατφόρμας kydo.gr αποδέχεστε πλήρως τους παρόντες όρους.</p>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>2. Περιγραφή υπηρεσίας</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>Το Kydo είναι πλατφόρμα διαμεσολάβησης μεταξύ οικογενειών και επαγγελματιών κατ' οίκον φροντίδας. Δεν αποτελεί εργοδότη.</p>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>3. Εγγραφή</h2>
      <ul style={{ fontSize: '14px', color: '#444', lineHeight: 1.8, paddingLeft: '1.3rem' }}>
        <li>Άνω των 18 ετών.</li>
        <li>Ευθύνη για ασφάλεια κωδικού.</li>
        <li>Απαγορεύονται ψευδείς λογαριασμοί.</li>
      </ul>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>4. Πληρωμές</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}>Χρέωση €19 για ξεκλείδωμα στοιχείων. Μη επιστρεπτέα.</p>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>5. Επικοινωνία</h2>
      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.8 }}><strong>info@kydo.gr</strong></p>
    </div>
  )
}