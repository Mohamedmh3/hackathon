import type { ContractStatus, PlayerStatus } from './domain'

export interface PlayerDocument {
  id: string
  name: string
  type: 'id' | 'passport' | 'contract' | 'other'
  uploadedAt: string
}

export interface PlayerAchievement {
  id: string
  title: string
  eventDate: string
  rank: string
  imageUrl?: string
}

export interface PlayerContractSummary {
  id: string
  clubId: string
  startDate: string
  endDate: string
  status: ContractStatus
}

export interface PlayerHistoryEntry {
  id: string
  clubId: string
  startDate: string
  endDate: string
  reason: string
}

export interface PlayerStatusChange {
  id: string
  oldStatus: PlayerStatus
  newStatus: PlayerStatus
  reason: string
  changedBy: string
  changedAt: string
}

export interface ManagedPlayer {
  id: string
  playerCode: string
  fullName: string
  photoUrl: string
  sportId: string
  currentClubId: string
  enrollmentDate: string
  birthDate: string
  nationality: string
  gender: 'male' | 'female'
  status: PlayerStatus
  deathDate?: string
  contractStatus: ContractStatus
  contracts: PlayerContractSummary[]
  history: PlayerHistoryEntry[]
  achievements: PlayerAchievement[]
  documents: PlayerDocument[]
  statusChanges: PlayerStatusChange[]
}

export interface PlayerFiltersValue {
  search: string
  sportId: string
  clubId: string
  status: string
  gender: string
}

export interface PlayerFormInput {
  fullName: string
  playerCode: string
  sportId: string
  currentClubId: string
  enrollmentDate: string
  birthDate: string
  nationality: string
  gender: 'male' | 'female'
}
