'use client'

export default function DataDeletionPage() {
  const p = { fontSize: '14px', color: '#444', lineHeight: 1.9, marginBottom: '.8rem' } as const
  const li = { fontSize: '14px', color: '#444', lineHeight: 1.9 } as const
  const ul = { paddingLeft: '1.4rem', marginBottom: '1rem' } as const

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.4rem', letterSpacing: '-.5px' }}>
        Διαγραφή Δεδομένων
      </h1>
      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '2rem' }}>
        Data Deletion Instructions
      </div>

      <p style={p}>
        Εάν έχετε συνδεθεί στο <strong>Kydo</strong> μέσω Facebook και επιθυμείτε τη διαγραφή των δεδομένων σας, ακολουθήστε τα παρακάτω βήματα:
      </p>

      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>
        Βήμα 1 — Αφαίρεση πρόσβασης από Facebook
      </h2>
      <ul style={ul}>
        <li style={li}>Μεταβείτε στις Ρυθμίσεις του Facebook</li>
        <li style={li}>Επιλέξτε <strong>Ασφάλεια και σύνδεση → Εφαρμογές και ιστότοποι</strong></li>
        <li style={li}>Βρείτε το <strong>Kydo Register</strong> και πατήστε <strong>Αφαίρεση</strong></li>
      </ul>

      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>
        Βήμα 2 — Διαγραφή λογαριασμού Kydo
      </h2>
      <ul style={ul}>
        <li style={li}>Συνδεθείτε στο <a href="https://kydo.gr" style={{ color: 'var(--teal)' }}>kydo.gr</a></li>
        <li style={li}>Μεταβείτε στις <strong>Ρυθμίσεις</strong> του λογαριασμού σας</li>
        <li style={li}>Επιλέξτε <strong>«Διαγραφή λογαριασμού»</strong></li>
      </ul>

      <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 .5rem' }}>
        Εναλλακτικά — Αίτημα μέσω email
      </h2>
      <p style={p}>
        Στείλτε email στο <a href="mailto:info@kydo.gr" style={{ color: 'var(--teal)', fontWeight: 600 }}>info@kydo.gr</a> με:
      </p>
      <ul style={ul}>
        <li style={li}>Θέμα: <strong>«Αίτημα διαγραφής δεδομένων»</strong></li>
        <li style={li}>Το email του λογαριασμού σας</li>
      </ul>
      <p style={p}>
        Θα λάβετε επιβεβαίωση εντός <strong>48 ωρών</strong> και η διαγραφή ολοκληρώνεται εντός <strong>30 ημερών</strong>.
      </p>

      <div style={{
        background: 'var(--teal-l)', border: '1px solid #b8e8d8',
        borderRadius: 'var(--rs)', padding: '1rem 1.2rem', marginTop: '1.5rem',
        fontSize: '13px', color: 'var(--teal)',
      }}>
        Μετά τη διαγραφή, όλα τα δεδομένα που ελήφθησαν από το Facebook (όνομα, email) αφαιρούνται οριστικά από τα συστήματά μας.
      </div>
    </div>
  )
}
