// Shared types for the job-postings flow.

export type JobStatus = 'open' | 'filled' | 'closed' | 'expired'

export type JobPosting = {
  id: string
  family_id: string
  title: string
  description: string
  category: string
  patient_info?: string
  area: string
  lat?: number
  lng?: number
  schedule_days: string[]
  schedule_hours?: string
  pay_per_hour?: number
  is_urgent: boolean
  status: JobStatus
  created_at: string
  expires_at: string
}

export type JobUnlock = {
  id: string
  job_id: string
  professional_id: string
  message?: string
  created_at: string
}

export const JOB_UNLOCK_PRICE_CENTS = 199
export const JOB_CATEGORIES = [
  'Αποκλειστική / Νοσοκόμα',
  'Φυσιοθεραπευτής/τρια',
  'Οικιακή Βοηθός',
  'Βοηθός Ασθενών',
  'Εργοθεραπευτής/τρια',
] as const
