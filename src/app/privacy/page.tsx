'use client'

export default function PrivacyPage() {
  const h2 = { fontSize: '1.1rem', fontWeight: 700, margin: '2rem 0 .6rem', color: '#111' } as const
  const p = { fontSize: '14px', color: '#444', lineHeight: 1.9, marginBottom: '.8rem' } as const
  const li = { fontSize: '14px', color: '#444', lineHeight: 1.9 } as const
  const ul = { paddingLeft: '1.4rem', marginBottom: '.8rem' } as const

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '.4rem', letterSpacing: '-.5px' }}>
        Πολιτική Απορρήτου
      </h1>
      <div style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '2.5rem' }}>
        Τελευταία ενημέρωση: Μάιος 2026
      </div>

      <p style={p}>
        Η παρούσα Πολιτική Απορρήτου περιγράφει τον τρόπο με τον οποίο η πλατφόρμα <strong>Kydo</strong> (kydo.gr / kydocare.gr) συλλέγει, χρησιμοποιεί και προστατεύει τα προσωπικά σας δεδομένα, σύμφωνα με τον Γενικό Κανονισμό Προστασίας Δεδομένων (ΓΚΠΔ/GDPR — ΕΕ 2016/679) και την ισχύουσα ελληνική νομοθεσία.
      </p>

      <h2 style={h2}>1. Υπεύθυνος Επεξεργασίας</h2>
      <p style={p}>
        <strong>Kydo</strong><br />
        Email: <a href="mailto:info@kydo.gr" style={{ color: 'var(--teal)' }}>info@kydo.gr</a><br />
        Ιστότοπος: kydo.gr
      </p>

      <h2 style={h2}>2. Δεδομένα που Συλλέγουμε</h2>
      <p style={p}>Συλλέγουμε τα ακόλουθα δεδομένα κατά την εγγραφή και χρήση της πλατφόρμας:</p>
      <ul style={ul}>
        <li style={li}><strong>Στοιχεία ταυτότητας:</strong> όνομα, επώνυμο</li>
        <li style={li}><strong>Στοιχεία επικοινωνίας:</strong> email, αριθμός κινητού τηλεφώνου</li>
        <li style={li}><strong>Επαγγελματικά στοιχεία</strong> (για επαγγελματίες): κατηγορία, ειδικότητα, χρόνια εμπειρίας, αμοιβή, περιοχή, αριθμός μητρώου ΕΦΚΑ/ΕΟΠΠΕΠ</li>
        <li style={li}><strong>Έγγραφα επαλήθευσης</strong> (για επαγγελματίες): πτυχία, πιστοποιητικά, ποινικό μητρώο (αποθηκεύονται κρυπτογραφημένα)</li>
        <li style={li}><strong>Δεδομένα χρήσης:</strong> σελίδες που επισκεφτήκατε, αναζητήσεις, unlocks, αξιολογήσεις</li>
        <li style={li}><strong>Τεχνικά δεδομένα:</strong> διεύθυνση IP, τύπος browser, χρόνος επίσκεψης</li>
      </ul>

      <h2 style={h2}>3. Δεδομένα από Social Login (Google & Facebook)</h2>
      <p style={p}>
        Εάν επιλέξετε να συνδεθείτε μέσω <strong>Google</strong> ή <strong>Facebook</strong>, λαμβάνουμε από τον αντίστοιχο πάροχο τα εξής δεδομένα, αποκλειστικά για τη δημιουργία και διαχείριση του λογαριασμού σας:
      </p>
      <ul style={ul}>
        <li style={li}>Πλήρες όνομα</li>
        <li style={li}>Διεύθυνση email (εφόσον έχει επαληθευτεί από τον πάροχο)</li>
        <li style={li}>Μοναδικό αναγνωριστικό χρήστη (user ID) από τον πάροχο</li>
      </ul>
      <p style={p}>
        <strong>Δεν αποθηκεύουμε</strong> κωδικούς πρόσβασης, φωτογραφίες προφίλ, φίλους ή οποιαδήποτε άλλα δεδομένα των λογαριασμών σας στο Google ή Facebook πέρα από τα παραπάνω.
      </p>
      <p style={p}>
        Η χρήση των δεδομένων αυτών διέπεται επίσης από τις πολιτικές απορρήτου των αντίστοιχων παρόχων:
        <a href="https://policies.google.com/privacy" target="_blank" style={{ color: 'var(--teal)', marginLeft: 4 }}>Google Privacy Policy</a> |
        <a href="https://www.facebook.com/privacy/policy/" target="_blank" style={{ color: 'var(--teal)', marginLeft: 4 }}>Meta Privacy Policy</a>
      </p>

      <h2 style={h2}>4. Σκοπός & Νομική Βάση Επεξεργασίας</h2>
      <ul style={ul}>
        <li style={li}><strong>Εκτέλεση σύμβασης (άρθρο 6§1β ΓΚΠΔ):</strong> δημιουργία και διαχείριση λογαριασμού, παροχή υπηρεσιών πλατφόρμας</li>
        <li style={li}><strong>Έννομο συμφέρον (άρθρο 6§1στ ΓΚΠΔ):</strong> ασφάλεια πλατφόρμας, πρόληψη απάτης, βελτίωση υπηρεσιών</li>
        <li style={li}><strong>Συγκατάθεση (άρθρο 6§1α ΓΚΠΔ):</strong> αποστολή ενημερωτικών email (μπορείτε να αποσύρετε οποτεδήποτε)</li>
        <li style={li}><strong>Νομική υποχρέωση (άρθρο 6§1γ ΓΚΠΔ):</strong> φορολογική συμμόρφωση</li>
      </ul>

      <h2 style={h2}>5. Αποδέκτες Δεδομένων</h2>
      <p style={p}>Τα δεδομένα σας δεν πωλούνται σε τρίτους. Κοινοποιούνται μόνο σε:</p>
      <ul style={ul}>
        <li style={li}><strong>Supabase Inc.</strong> — φιλοξενία βάσης δεδομένων (EU region)</li>
        <li style={li}><strong>Vercel Inc.</strong> — φιλοξενία εφαρμογής</li>
        <li style={li}><strong>Stripe Inc.</strong> — επεξεργασία πληρωμών (όταν ενεργοποιηθεί)</li>
        <li style={li}><strong>Cloudflare Inc.</strong> — ασφάλεια και CDN</li>
      </ul>
      <p style={p}>Όλοι οι ανωτέρω υποεπεξεργαστές λειτουργούν βάσει σχετικών συμφωνιών επεξεργασίας δεδομένων (DPA) και τηρούν τον ΓΚΠΔ.</p>

      <h2 style={h2}>6. Διατήρηση Δεδομένων</h2>
      <ul style={ul}>
        <li style={li}>Ενεργοί λογαριασμοί: όσο διατηρείτε λογαριασμό</li>
        <li style={li}>Διαγραμμένοι λογαριασμοί: τα δεδομένα διαγράφονται εντός 30 ημερών από την αίτηση διαγραφής</li>
        <li style={li}>Δεδομένα πληρωμών: 5 χρόνια (φορολογική υποχρέωση)</li>
        <li style={li}>Αρχεία καταγραφής (logs): 90 ημέρες</li>
      </ul>

      <h2 style={h2}>7. Cookies</h2>
      <p style={p}>
        Χρησιμοποιούμε μόνο <strong>απαραίτητα cookies</strong> για τη λειτουργία της πλατφόρμας (session, authentication). Δεν χρησιμοποιούμε cookies tracking ή διαφήμισης. Λεπτομέρειες στο banner που εμφανίζεται κατά την πρώτη επίσκεψη.
      </p>

      <h2 style={h2}>8. Ασφάλεια Δεδομένων</h2>
      <p style={p}>
        Εφαρμόζουμε κατάλληλα τεχνικά και οργανωτικά μέτρα: κρυπτογράφηση δεδομένων σε ηρεμία και μεταφορά (TLS/HTTPS), περιορισμό πρόσβασης βάσει ρόλων, και τακτικές ελέγχους ασφαλείας. Τα έγγραφα επαλήθευσης αποθηκεύονται σε κρυπτογραφημένο private storage.
      </p>

      <h2 style={h2}>9. Δικαιώματά σας (ΓΚΠΔ)</h2>
      <p style={p}>Έχετε δικαίωμα:</p>
      <ul style={ul}>
        <li style={li}><strong>Πρόσβασης</strong> — να λάβετε αντίγραφο των δεδομένων σας</li>
        <li style={li}><strong>Διόρθωσης</strong> — να διορθώσετε ανακριβή δεδομένα</li>
        <li style={li}><strong>Διαγραφής</strong> — να ζητήσετε διαγραφή («δικαίωμα στη λήθη»)</li>
        <li style={li}><strong>Περιορισμού</strong> — να ζητήσετε προσωρινό περιορισμό επεξεργασίας</li>
        <li style={li}><strong>Φορητότητας</strong> — να λάβετε τα δεδομένα σας σε δομημένο format</li>
        <li style={li}><strong>Εναντίωσης</strong> — στην επεξεργασία βάσει έννομου συμφέροντος</li>
      </ul>
      <p style={p}>
        Για άσκηση οποιουδήποτε δικαιώματος: <a href="mailto:info@kydo.gr" style={{ color: 'var(--teal)' }}>info@kydo.gr</a>. Απαντάμε εντός 30 ημερών.
        Έχετε επίσης δικαίωμα καταγγελίας στην <a href="https://www.dpa.gr" target="_blank" style={{ color: 'var(--teal)' }}>Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα (ΑΠΔΠΧ)</a>.
      </p>

      <h2 id="data-deletion" style={{ ...h2, scrollMarginTop: '80px' }}>10. Διαγραφή Δεδομένων</h2>
      <p style={p}>
        Μπορείτε να ζητήσετε τη <strong>διαγραφή όλων των προσωπικών σας δεδομένων</strong> από την πλατφόρμα Kydo με έναν από τους παρακάτω τρόπους:
      </p>
      <ul style={ul}>
        <li style={li}><strong>Από τον λογαριασμό σας:</strong> Ρυθμίσεις → «Διαγραφή λογαριασμού»</li>
        <li style={li}><strong>Με email:</strong> στείλτε αίτημα στο <a href="mailto:info@kydo.gr" style={{ color: 'var(--teal)' }}>info@kydo.gr</a> με θέμα «Αίτημα διαγραφής δεδομένων» και το email του λογαριασμού σας</li>
      </ul>
      <p style={p}>
        Η διαγραφή ολοκληρώνεται εντός <strong>30 ημερών</strong>. Εξαιρούνται δεδομένα που οφείλουμε να διατηρήσουμε βάσει νομικής υποχρέωσης (π.χ. φορολογικά αρχεία).
      </p>
      <p style={p}>
        <strong>Για χρήστες που συνδέθηκαν μέσω Facebook:</strong> Η διαγραφή του λογαριασμού Kydo αφαιρεί αυτόματα όλα τα δεδομένα που ελήφθησαν από το Facebook (όνομα, email). Για να αφαιρέσετε την πρόσβαση του Kydo από τον Facebook λογαριασμό σας, μεταβείτε στις Ρυθμίσεις Facebook → Εφαρμογές και ιστότοποι → Kydo Register → Αφαίρεση.
      </p>

      <h2 style={h2}>11. Αλλαγές Πολιτικής</h2>
      <p style={p}>
        Ενδέχεται να ενημερώνουμε την παρούσα πολιτική περιοδικά. Θα σας ειδοποιούμε για ουσιαστικές αλλαγές μέσω email ή με ανακοίνωση στην πλατφόρμα. Η συνέχιση χρήσης μετά την ενημέρωση συνεπάγεται αποδοχή.
      </p>

      <h2 style={h2}>12. Επικοινωνία</h2>
      <p style={p}>
        Για οποιοδήποτε ερώτημα σχετικά με την παρούσα πολιτική:<br />
        <a href="mailto:info@kydo.gr" style={{ color: 'var(--teal)' }}>info@kydo.gr</a>
      </p>
    </div>
  )
}
