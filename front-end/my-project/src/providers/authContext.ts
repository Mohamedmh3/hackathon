import { createContext } from 'react'
import type { AppUser } from '../types/domain'

export interface LoginInput {
  email: string
  fullName: string
  password: string
}

export interface AuthContextValue {
  user: AppUser | null
  isAuthLoading: boolean
  authError: string | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: LoginInput) => Promise<void>
  clearAuthError: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
