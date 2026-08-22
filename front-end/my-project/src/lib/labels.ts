import type { ContractTerminationReason } from '../types/contractsTransfer'
import type { ContractStatus, PlayerStatus } from '../types/domain'
import type { PlayerDocument } from '../types/playerManagement'

export function getPlayerStatusLabel(status: PlayerStatus): string {
  switch (status) {
    case 'active':
      return 'عامل'
    case 'free':
      return 'متوفر'
    case 'retired':
      return 'متقاعد'
    case 'deceased':
      return 'متوفى'
    default:
      return status
  }
}

export function getContractStatusLabel(status: ContractStatus): string {
  switch (status) {
    case 'active':
      return 'نشط'
    case 'expired':
      return 'منتهي'
    case 'terminated':
      return 'مفسوخ'
    case 'transferred':
      return 'منتقل'
    default:
      return status
  }
}

export function getGenderLabel(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'ذكر' : 'أنثى'
}

export function getTerminationReasonLabel(
  reason?: ContractTerminationReason,
): string {
  if (!reason) {
    return '-'
  }

  switch (reason) {
    case 'contract_expired':
      return 'انتهاء مدة'
    case 'mutual_termination':
      return 'فسخ بالتراضي'
    case 'unilateral_termination':
      return 'فسخ أحادي'
    case 'retirement':
      return 'تقاعد'
    case 'transfer':
      return 'انتقال'
    default:
      return reason
  }
}

export function getDocumentTypeLabel(type: PlayerDocument['type']): string {
  switch (type) {
    case 'id':
      return 'هوية'
    case 'passport':
      return 'جواز سفر'
    case 'contract':
      return 'عقد'
    case 'other':
      return 'أخرى'
    default:
      return type
  }
}
