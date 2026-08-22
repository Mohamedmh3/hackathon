import type { ContractStatus } from './domain'

export type ContractTerminationReason =
  | 'contract_expired'
  | 'mutual_termination'
  | 'unilateral_termination'
  | 'retirement'
  | 'transfer'

export function isContractTerminationReason(
  value: string,
): value is ContractTerminationReason {
  return (
    value === 'contract_expired' ||
    value === 'mutual_termination' ||
    value === 'unilateral_termination' ||
    value === 'retirement' ||
    value === 'transfer'
  )
}

export interface ContractRecord {
  id: string
  playerId: string
  clubId: string
  startDate: string
  endDate: string
  status: ContractStatus
  terminationReason?: ContractTerminationReason
  notes?: string
}

export interface TransferRecord {
  id: string
  playerId: string
  fromClubId: string
  toClubId: string
  previousContractId: string
  newContractId: string
  transferDate: string
  executedBy: string
}
