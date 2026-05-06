// Stripe subscription tier configuration.
// Price IDs are read from env so test/live keys can differ.

export type SubscriptionTier = 'family_weekly' | 'family_monthly' | 'pro_monthly' | 'pro_annual'

export type TierInfo = {
  id: SubscriptionTier
  audience: 'family' | 'pro'
  label: string
  priceLabel: string
  intervalLabel: string
  amountCents: number
  envKey: string
  features: string[]
  highlight?: boolean
}

export const TIERS: Record<SubscriptionTier, TierInfo> = {
  family_weekly: {
    id: 'family_weekly',
    audience: 'family',
    label: 'Εβδομαδιαία',
    priceLabel: '€9.99',
    intervalLabel: 'εβδομάδα',
    amountCents: 999,
    envKey: 'STRIPE_PRICE_FAMILY_WEEKLY',
    features: [
      'Απεριόριστα στοιχεία επικοινωνίας',
      'Πρόσβαση σε όλους τους επαγγελματίες',
      'Διάρκεια 7 ημερών',
    ],
  },
  family_monthly: {
    id: 'family_monthly',
    audience: 'family',
    label: 'Μηνιαία',
    priceLabel: '€19.99',
    intervalLabel: 'μήνα',
    amountCents: 1999,
    envKey: 'STRIPE_PRICE_FAMILY_MONTHLY',
    highlight: true,
    features: [
      'Απεριόριστα στοιχεία επικοινωνίας',
      'Ειδοποιήσεις για νέους επαγγελματίες',
      'Υποστήριξη προτεραιότητας',
      'Διάρκεια 30 ημερών',
    ],
  },
  pro_monthly: {
    id: 'pro_monthly',
    audience: 'pro',
    label: 'Pro Μηνιαία',
    priceLabel: '€12.99',
    intervalLabel: 'μήνα',
    amountCents: 1299,
    envKey: 'STRIPE_PRICE_PRO_MONTHLY',
    features: [
      'Express badge στη search',
      'Κορυφαία θέση στα αποτελέσματα',
      'Premium Pro badge στο προφίλ',
      'Dashboard analytics',
      'Ταχεία επαλήθευση',
    ],
  },
  pro_annual: {
    id: 'pro_annual',
    audience: 'pro',
    label: 'Pro Ετήσια',
    priceLabel: '€99',
    intervalLabel: 'έτος',
    amountCents: 9900,
    envKey: 'STRIPE_PRICE_PRO_ANNUAL',
    highlight: true,
    features: [
      'Όλα τα προνόμια Pro Monthly',
      'Εξοικονόμηση 36% σε σχέση με τη μηνιαία',
      'Ισοδυναμεί με €8.25/μήνα',
    ],
  },
}

export function getPriceId(tier: SubscriptionTier): string {
  const info = TIERS[tier]
  const priceId = process.env[info.envKey]
  if (!priceId) throw new Error(`Missing env var ${info.envKey}`)
  return priceId
}

export function tierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const tier of Object.keys(TIERS) as SubscriptionTier[]) {
    if (process.env[TIERS[tier].envKey] === priceId) return tier
  }
  return null
}

export function isFamilyTier(tier: SubscriptionTier): boolean {
  return TIERS[tier].audience === 'family'
}
