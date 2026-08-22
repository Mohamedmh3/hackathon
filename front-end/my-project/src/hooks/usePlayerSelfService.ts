import { useMemo, useState } from 'react'
import { INITIAL_MANAGED_PLAYERS } from '../data/playerManagementData'
import type { ManagedPlayer } from '../types/playerManagement'

const SELF_SERVICE_STORAGE_KEY = 'player-self-service-overrides'

interface PlayerOverrides {
  photoUrl?: string
  achievementImages?: Record<string, string>
}

type PlayerOverrideMap = Record<string, PlayerOverrides>

function loadOverrides(): PlayerOverrideMap {
  const rawValue = localStorage.getItem(SELF_SERVICE_STORAGE_KEY)
  if (!rawValue) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return parsed as PlayerOverrideMap
  } catch (error) {
    console.error('Failed to parse self-service profile overrides.', error)
    localStorage.removeItem(SELF_SERVICE_STORAGE_KEY)
    return {}
  }
}

export function usePlayerSelfService() {
  const [overrides, setOverrides] = useState<PlayerOverrideMap>(() => loadOverrides())

  const players = useMemo<ManagedPlayer[]>(() => {
    return INITIAL_MANAGED_PLAYERS.map((player) => {
      const override = overrides[player.id]
      if (!override) {
        return player
      }

      return {
        ...player,
        photoUrl: override.photoUrl ?? player.photoUrl,
        achievements: player.achievements.map((achievement) => ({
          ...achievement,
          imageUrl:
            override.achievementImages?.[achievement.id] ?? achievement.imageUrl,
        })),
      }
    })
  }, [overrides])

  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  )

  const persist = (nextOverrides: PlayerOverrideMap) => {
    setOverrides(nextOverrides)
    localStorage.setItem(
      SELF_SERVICE_STORAGE_KEY,
      JSON.stringify(nextOverrides),
    )
  }

  const updatePlayerPhoto = (playerId: string, photoUrl: string) => {
    const trimmed = photoUrl.trim()
    if (!trimmed) {
      console.error('Photo URL is required.')
      return
    }

    const current = overrides[playerId] ?? {}
    const nextOverrides: PlayerOverrideMap = {
      ...overrides,
      [playerId]: {
        ...current,
        photoUrl: trimmed,
      },
    }
    persist(nextOverrides)
  }

  const updateAchievementImage = (
    playerId: string,
    achievementId: string,
    imageUrl: string,
  ) => {
    const trimmed = imageUrl.trim()
    if (!trimmed) {
      console.error('Achievement image URL is required.')
      return
    }

    const current = overrides[playerId] ?? {}
    const achievementImages = {
      ...(current.achievementImages ?? {}),
      [achievementId]: trimmed,
    }
    const nextOverrides: PlayerOverrideMap = {
      ...overrides,
      [playerId]: {
        ...current,
        achievementImages,
      },
    }
    persist(nextOverrides)
  }

  return {
    players,
    playersById,
    updatePlayerPhoto,
    updateAchievementImage,
  }
}
