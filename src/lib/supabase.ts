import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Types
export type Profile = {
  id: string
  full_name: string
  role: 'family' | 'professional'
  phone?: string
  area?: string
  deleted_at?: string
}

export type Professional = {
  id: string
  category: string
  specializations: string[]
  experience_years: number
  hourly_rate: number
  bio?: string
  area?: string
  lat?: number
  lng?: number
  available_days: string[]
  time_from?: string
  time_to?: string
  is_express: boolean
  is_verified: boolean
  is_featured: boolean
  has_criminal_check: boolean
  rating: number
  total_reviews: number
  registry_number?: string
  profiles?: {
    full_name: string
    area?: string
    phone?: string
  }
}

export type Review = {
  id: string
  professional_id: string
  family_id: string
  rating: number
  comment: string
  created_at: string
  profiles?: {
    full_name: string
  }
}