import { useEffect, useMemo, useState } from 'react'
import {
  changePlayerStatusRequest,
  createPlayerRequest,
  getPlayersRequest,
  getStoredAuthToken,
  updatePlayerRequest,
} from '../lib/api'
import type { PlayerStatus } from '../types/domain'
import type {
  ManagedPlayer,
  PlayerFiltersValue,
  PlayerFormInput,
} from '../types/playerManagement'

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function mapBackendPlayer(player: {
  id: string
  player_code: string
  full_name: string
  sport_id: string
  current_club_id: string | null
  enrollment_date: string | null
  birth_date: string
  nationality: string
  gender: 'male' | 'female'
  status: 'active' | 'retired' | 'free' | 'deceased'
  death_date: string | null
  photo_url: string | null
}): ManagedPlayer {
  return {
    id: player.id,
    playerCode: player.player_code,
    fullName: player.full_name,
    photoUrl:
      player.photo_url ??
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80',
    sportId: player.sport_id,
    currentClubId: player.current_club_id ?? '',
    enrollmentDate: player.enrollment_date ?? '',
    birthDate: player.birth_date,
    nationality: player.nationality,
    gender: player.gender,
    status: player.status,
    deathDate: player.death_date ?? undefined,
    contractStatus: 'active',
    contracts: [],
    history: [],
    achievements: [],
    documents: [],
    statusChanges: [],
  }
}

export function usePlayerManagement() {
  const [players, setPlayers] = useState<ManagedPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const accessToken = getStoredAuthToken()
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    let isAlive = true
    setIsLoading(true)

    getPlayersRequest(accessToken)
      .then((records) => {
        if (!isAlive) {
          return
        }
        setPlayers(records.map(mapBackendPlayer))
      })
      .catch((error) => {
        console.error('Failed to load players from backend.', error)
      })
      .finally(() => {
        if (isAlive) {
          setIsLoading(false)
        }
      })

    return () => {
      isAlive = false
    }
  }, [])

  const createPlayer = (input: PlayerFormInput) => {
    const nextPlayer: ManagedPlayer = {
      id: makeId('player'),
      playerCode: input.playerCode,
      fullName: input.fullName,
      photoUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=300&q=80',
      sportId: input.sportId,
      currentClubId: input.currentClubId,
      enrollmentDate: input.enrollmentDate,
      birthDate: input.birthDate,
      nationality: input.nationality,
      gender: input.gender,
      status: 'active',
      contractStatus: 'active',
      contracts: [],
      history: [],
      achievements: [],
      documents: [],
      statusChanges: [],
    }

    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void createPlayerRequest(
        {
          playerCode: input.playerCode,
          fullName: input.fullName,
          sportId: input.sportId,
          currentClubId: input.currentClubId,
          enrollmentDate: input.enrollmentDate,
          birthDate: input.birthDate,
          nationality: input.nationality,
          gender: input.gender,
          status: 'active',
        },
        accessToken,
      )
        .then((created) => {
          setPlayers((prev) => [mapBackendPlayer(created), ...prev.filter((player) => player.id !== nextPlayer.id)])
        })
        .catch((error) => {
          console.error('Failed to create player via backend.', error)
        })
    }

    setPlayers((prev) => [nextPlayer, ...prev])
    return nextPlayer
  }

  const updatePlayer = (playerId: string, input: PlayerFormInput) => {
    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void updatePlayerRequest(
        playerId,
        {
          fullName: input.fullName,
          sportId: input.sportId,
          currentClubId: input.currentClubId,
          enrollmentDate: input.enrollmentDate,
          birthDate: input.birthDate,
          nationality: input.nationality,
          gender: input.gender,
        },
        accessToken,
      ).catch((error) => {
        console.error('Failed to update player via backend.', error)
      })
    }

    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId
          ? {
              ...player,
              ...input,
            }
          : player,
      ),
    )
  }

  const changePlayerStatus = (
    playerId: string,
    newStatus: PlayerStatus,
    reason: string,
    changedBy: string,
  ) => {
    const changedAt = new Date().toISOString().slice(0, 10)
    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void changePlayerStatusRequest(
        playerId,
        { status: newStatus, reason, deathDate: newStatus === 'deceased' ? changedAt : null },
        accessToken,
      ).catch((error) => {
        console.error('Failed to change player status via backend.', error)
      })
    }

    setPlayers((prev) =>
      prev.map((player) => {
        if (player.id !== playerId) {
          return player
        }

        return {
          ...player,
          status: newStatus,
          deathDate: newStatus === 'deceased' ? changedAt : undefined,
          statusChanges: [
            {
              id: makeId('status-change'),
              oldStatus: player.status,
              newStatus,
              reason,
              changedBy,
              changedAt,
            },
            ...player.statusChanges,
          ],
        }
      }),
    )
  }

  const filterPlayers = (filters: PlayerFiltersValue) => {
    const searchValue = filters.search.trim().toLowerCase()
    return players.filter((player) => {
      const matchesSearch =
        searchValue.length === 0 ||
        player.fullName.toLowerCase().includes(searchValue) ||
        player.playerCode.toLowerCase().includes(searchValue)
      const matchesSport =
        filters.sportId === 'all' || player.sportId === filters.sportId
      const matchesClub =
        filters.clubId === 'all' || player.currentClubId === filters.clubId
      const matchesStatus =
        filters.status === 'all' || player.status === filters.status
      const matchesGender =
        filters.gender === 'all' || player.gender === filters.gender

      return (
        matchesSearch &&
        matchesSport &&
        matchesClub &&
        matchesStatus &&
        matchesGender
      )
    })
  }

  const playerById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  )

  return {
    players,
    playerById,
    isLoading,
    createPlayer,
    updatePlayer,
    changePlayerStatus,
    filterPlayers,
  }
}
