import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isUserRole } from '../types/domain'
import type { AppUser } from '../types/domain'
import { ApiError, getMeRequest, loginRequest, registerRequest } from '../lib/api'
import { AuthContext } from './authContext'
import type { AuthContextValue, LoginInput } from './authContext'

const AUTH_STORAGE_KEY = 'player-membership-auth-session'

interface StoredAuthSession {
  user: AppUser
  accessToken: string
}

function isStoredUser(value: unknown): value is AppUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.fullName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.role === 'string' &&
    isUserRole(candidate.role)
  )
}

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.accessToken === 'string' &&
    isStoredUser(candidate.user)
  )
}

function mapMeToAppUser(data: {
  id: string
  email: string
  profile: {
    full_name: string | null
    role: string
    club_id: string | null
    player_id: string | null
  }
}): AppUser {
  if (!isUserRole(data.profile.role)) {
    throw new Error(`Unsupported user role from backend: ${data.profile.role}`)
  }
  return {
    id: data.id,
    fullName: data.profile.full_name ?? data.email.split('@')[0] ?? 'User',
    email: data.email.toLowerCase(),
    role: data.profile.role,
    clubId: data.profile.club_id ?? undefined,
    playerId: data.profile.player_id ?? undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawValue) {
      setIsAuthLoading(false)
      return
    }

    try {
      const parsed = JSON.parse(rawValue) as unknown
      if (!isStoredSession(parsed)) {
       console.error('Stored auth session has invalid shape.')
       localStorage.removeItem(AUTH_STORAGE_KEY)
       setIsAuthLoading(false)
       return
      }

      const storedSession = parsed
      void getMeRequest(storedSession.accessToken)
       .then((meData) => {
         const nextUser = mapMeToAppUser(meData)
         setUser(nextUser)
         localStorage.setItem(
           AUTH_STORAGE_KEY,
           JSON.stringify({ user: nextUser, accessToken: storedSession.accessToken }),
         )
       })
       .catch((error) => {
         console.error('Failed to restore auth session from backend.', error)
         localStorage.removeItem(AUTH_STORAGE_KEY)
         setUser(null)
       })
       .finally(() => {
         setIsAuthLoading(false)
       })
    } catch (error) {
      console.error('Failed to parse stored auth session.', error)
      localStorage.removeItem(AUTH_STORAGE_KEY)
      setIsAuthLoading(false)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthLoading,
      authError,
      isAuthenticated: user !== null,
      login: async (input: LoginInput) => {
       setIsAuthLoading(true)
       setAuthError(null)
       try {
         const session = await loginRequest({
           email: input.email.toLowerCase(),
           password: input.password,
         })
         const meData = await getMeRequest(session.accessToken)
         const nextUser = mapMeToAppUser(meData)
         setUser(nextUser)
         localStorage.setItem(
           AUTH_STORAGE_KEY,
           JSON.stringify({ user: nextUser, accessToken: session.accessToken }),
         )
       } catch (error) {
         const message =
           error instanceof ApiError ? error.message : 'Login failed'
         setAuthError(message)
         throw error
       } finally {
         setIsAuthLoading(false)
       }
      },
      register: async (input: LoginInput) => {
       setIsAuthLoading(true)
       setAuthError(null)
       try {
         await registerRequest({
           fullName: input.fullName.trim(),
           email: input.email.toLowerCase(),
           password: input.password,
         })
         const session = await loginRequest({
           email: input.email.toLowerCase(),
           password: input.password,
         })
         const meData = await getMeRequest(session.accessToken)
         const nextUser = mapMeToAppUser(meData)
         setUser(nextUser)
         localStorage.setItem(
           AUTH_STORAGE_KEY,
           JSON.stringify({ user: nextUser, accessToken: session.accessToken }),
         )
       } catch (error) {
         const message =
           error instanceof ApiError ? error.message : 'Registration failed'
         setAuthError(message)
         throw error
       } finally {
         setIsAuthLoading(false)
       }
      },
      clearAuthError: () => {
       setAuthError(null)
      },
      logout: () => {
       setUser(null)
       setAuthError(null)
       localStorage.removeItem(AUTH_STORAGE_KEY)
      },
    }),
    [authError, isAuthLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
