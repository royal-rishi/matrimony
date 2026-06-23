/**
 * Application-wide constants for Rishtajodo Matrimony.
 * Import these instead of using raw strings throughout the codebase.
 */

export const APP_NAME = 'Rishtajodo Matrimony'
export const APP_TAGLINE = 'Dil se Dil ka Milan'
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rishtajodo.com'

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Profile
export const MAX_PROFILE_PHOTOS = 10
export const MIN_AGE = 18
export const MAX_AGE = 70

// Associate hierarchy level labels
export const ASSOCIATE_LEVEL_LABELS: Record<string, string> = {
  local_associate: 'Local Associate',
  block_associate: 'Block Associate',
  district_associate: 'District Associate',
  state_associate: 'State Associate',
}

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['View 10 profiles/day', 'Send 5 interests/month'],
    color: 'gray',
  },
  premium_gold: {
    name: 'Gold',
    price: 2999,
    features: ['Unlimited profiles', '50 interests/month', 'See contact details', 'Priority listing'],
    color: 'yellow',
  },
  premium_platinum: {
    name: 'Platinum',
    price: 4999,
    features: ['Everything in Gold', 'AI Matchmaking', 'Dedicated Associate', 'Profile boost'],
    color: 'purple',
  },
  elite: {
    name: 'Elite',
    price: 9999,
    features: ['Everything in Platinum', 'Personal matchmaker', 'Background verification', 'Premium support'],
    color: 'pink',
  },
} as const

// Commission rates per associate level (in percentage)
export const COMMISSION_RATES: Record<string, number> = {
  local_associate: 10,
  block_associate: 5,
  district_associate: 3,
  state_associate: 2,
}

// Indian states list
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
] as const

// Religions
export const RELIGIONS = [
  'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Other',
] as const

// Education levels
export const EDUCATION_LEVELS = [
  'High School', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'MBA',
  'PhD / Doctorate', 'MD / MS (Medical)', 'LLB / LLM (Law)', 'Other',
] as const
