import type { Professional } from './supabase'

export type Checkpoint = {
  key: string
  label: string
  done: boolean
}

export type VerificationState = {
  checkpoints: Checkpoint[]
  done: number
  total: number
  percent: number
}

type Inputs = {
  pro: Professional
  hasPhone: boolean
  emailConfirmed: boolean
  bioLen: number
}

export function computeVerification({ pro, hasPhone, emailConfirmed, bioLen }: Inputs): VerificationState {
  const now = Date.now()
  const cprValid = !!pro.cpr_cert_path && !!pro.cpr_expiry && new Date(pro.cpr_expiry).getTime() > now

  const checkpoints: Checkpoint[] = [
    { key: 'email', label: 'Email επιβεβαιωμένο', done: emailConfirmed },
    { key: 'phone', label: 'Τηλέφωνο', done: hasPhone },
    { key: 'photo', label: 'Φωτογραφία προφίλ', done: !!pro.photo_url },
    { key: 'bio', label: 'Σύντομη παρουσίαση', done: bioLen >= 50 },
    { key: 'cv', label: 'Βιογραφικό (CV)', done: !!pro.cv_path },
    { key: 'diploma', label: 'Πτυχίο / πιστοποιητικό', done: !!pro.diploma_path },
    { key: 'cpr', label: 'Α\' Βοήθειες / CPR', done: cprValid },
    { key: 'registry', label: 'Αρ. μητρώου ΕΦΚΑ/ΕΟΠΠΕΠ', done: !!pro.registry_number },
    { key: 'criminal', label: 'Ποινικό μητρώο', done: !!pro.has_criminal_check },
    { key: 'reviews', label: 'Αξιολογήσεις από οικογένειες', done: pro.total_reviews > 0 },
  ]

  const done = checkpoints.filter(c => c.done).length
  const total = checkpoints.length
  return {
    checkpoints,
    done,
    total,
    percent: Math.round((done / total) * 100),
  }
}
