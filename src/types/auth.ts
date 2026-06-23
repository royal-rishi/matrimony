// ============================================================
// AUTH TYPES - Rishtajodo Matrimony
// ============================================================

import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from './database'

export interface AuthUser extends User {
  role?: UserRole
}

export interface AuthSession extends Session {
  user: AuthUser
}

export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
}

export interface SignUpPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  gender: string
  date_of_birth: string
}

export interface SignInPayload {
  email: string
  password: string
}
