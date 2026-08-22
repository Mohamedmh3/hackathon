export const USER_ROLES = ['admin', 'club_staff', 'player', 'public'] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}

export const PLAYER_STATUSES = ['active', 'retired', 'free', 'deceased'] as const

export type PlayerStatus = (typeof PLAYER_STATUSES)[number]

export function isPlayerStatus(value: string): value is PlayerStatus {
  return PLAYER_STATUSES.includes(value as PlayerStatus)
}

export const CONTRACT_STATUSES = [
  'active',
  'expired',
  'terminated',
  'transferred',
] as const

export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export interface AppUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  clubId?: string
  playerId?: string
}

export interface NavItem {
  label: string
  path: string
  roles?: UserRole[]
}

export interface PublicCatalogClub {
  id: string
  name: string
  city: string
  sportIds: string[]
  status: 'active' | 'inactive'
}

export interface PublicCatalogPlayer {
  id: string
  fullName: string
  sportId: string
  currentClubId: string
  status: PlayerStatus
  gender: 'male' | 'female'
  nationality: string
}
