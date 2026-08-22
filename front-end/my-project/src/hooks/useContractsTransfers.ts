import { useMemo, useState } from 'react'
import { INITIAL_MANAGED_PLAYERS } from '../data/playerManagementData'
import type { PlayerStatus, UserRole } from '../types/domain'
import type { ManagedPlayer } from '../types/playerManagement'
import type {
  ContractRecord,
  ContractTerminationReason,
  TransferRecord,
} from '../types/contractsTransfer'

interface TransferInput {
  playerId: string
  toClubId: string
  startDate: string
  endDate: string
  executedBy: string
}

interface CloseContractInput {
  contractId: string
  reason: ContractTerminationReason
  executedBy: string
}

interface ContractScope {
  role: UserRole
  clubId?: string
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function mapPlayersToContracts(players: ManagedPlayer[]): ContractRecord[] {
  return players.flatMap((player) =>
    player.contracts.map((contract) => ({
      id: contract.id,
      playerId: player.id,
      clubId: contract.clubId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
    })),
  )
}

export function useContractsTransfers() {
  const [players, setPlayers] = useState<ManagedPlayer[]>(INITIAL_MANAGED_PLAYERS)
  const [contracts, setContracts] = useState<ContractRecord[]>(() =>
    mapPlayersToContracts(INITIAL_MANAGED_PLAYERS),
  )
  const [transferLog, setTransferLog] = useState<TransferRecord[]>([])

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  )

  const getScopedContracts = ({ role, clubId }: ContractScope) => {
    if (role === 'admin') {
      return contracts
    }
    if (role === 'club_staff' && clubId) {
      return contracts.filter((contract) => contract.clubId === clubId)
    }
    return []
  }

  const closeContract = ({ contractId, reason, executedBy }: CloseContractInput) => {
    const nowDate = new Date().toISOString().slice(0, 10)
    const contract = contracts.find((item) => item.id === contractId)
    if (!contract) {
      console.error(`Contract not found: ${contractId}`)
      return
    }

    const nextStatus: ContractRecord['status'] =
      reason === 'contract_expired'
        ? 'expired'
        : reason === 'transfer'
          ? 'transferred'
          : 'terminated'

    setContracts((prev) =>
      prev.map((item) =>
        item.id === contractId
          ? { ...item, status: nextStatus, terminationReason: reason }
          : item,
      ),
    )

    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== contract.playerId) {
          return player
        }

        const playerStatus: PlayerStatus =
          reason === 'retirement'
            ? 'retired'
            : reason === 'contract_expired' || reason === 'unilateral_termination'
              ? 'free'
              : player.status

        const updatedContracts = player.contracts.map((item) =>
          item.id === contractId ? { ...item, status: nextStatus } : item,
        )

        const shouldArchive = reason !== 'transfer'

        return {
          ...player,
          status: playerStatus,
          contractStatus: nextStatus,
          history: shouldArchive
            ? [
                {
                  id: makeId('history'),
                  clubId: contract.clubId,
                  startDate: contract.startDate,
                  endDate: nowDate,
                  reason,
                },
                ...player.history,
              ]
            : player.history,
          contracts: updatedContracts,
        }
      }),
    )

    if (reason !== 'transfer') {
      console.info(`Contract ${contractId} closed by ${executedBy}.`)
    }
  }

  const transferPlayer = ({
    playerId,
    toClubId,
    startDate,
    endDate,
    executedBy,
  }: TransferInput) => {
    const player = playersById.get(playerId)
    if (!player) {
      console.error(`Player not found: ${playerId}`)
      return
    }

    const activeContract = contracts.find(
      (item) => item.playerId === playerId && item.status === 'active',
    )
    if (!activeContract) {
      console.error(`No active contract available for player: ${playerId}`)
      return
    }

    if (activeContract.clubId === toClubId) {
      console.error('Target club must be different from the current club.')
      return
    }

    const transferDate = new Date().toISOString().slice(0, 10)
    const newContractId = makeId('contract')

    closeContract({
      contractId: activeContract.id,
      reason: 'transfer',
      executedBy,
    })

    const newContract: ContractRecord = {
      id: newContractId,
      playerId,
      clubId: toClubId,
      startDate,
      endDate,
      status: 'active',
    }
    setContracts((prev) => [newContract, ...prev])

    setPlayers((prev) =>
      prev.map((item) => {
        if (item.id !== playerId) {
          return item
        }

        return {
          ...item,
          currentClubId: toClubId,
          enrollmentDate: startDate,
          status: 'active',
          contractStatus: 'active',
          contracts: [
            { id: newContractId, clubId: toClubId, startDate, endDate, status: 'active' },
            ...item.contracts,
          ],
          history: [
            {
              id: makeId('history'),
              clubId: activeContract.clubId,
              startDate: activeContract.startDate,
              endDate: transferDate,
              reason: 'transfer',
            },
            ...item.history,
          ],
        }
      }),
    )

    setTransferLog((prev) => [
      {
        id: makeId('transfer'),
        playerId,
        fromClubId: activeContract.clubId,
        toClubId,
        previousContractId: activeContract.id,
        newContractId,
        transferDate,
        executedBy,
      },
      ...prev,
    ])
  }

  return {
    players,
    playersById,
    contracts,
    transferLog,
    getScopedContracts,
    closeContract,
    transferPlayer,
  }
}
