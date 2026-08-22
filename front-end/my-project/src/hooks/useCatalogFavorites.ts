import { useMemo, useState } from 'react'

interface CatalogFavorites {
  playerIds: string[]
  clubIds: string[]
}

interface UseCatalogFavoritesResult extends CatalogFavorites {
  togglePlayerFavorite: (playerId: string) => void
  toggleClubFavorite: (clubId: string) => void
}

function parseFavorites(value: string | null): CatalogFavorites {
  if (!value) {
    return { playerIds: [], clubIds: [] }
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return { playerIds: [], clubIds: [] }
    }

    const candidate = parsed as Record<string, unknown>
    const playerIds = Array.isArray(candidate.playerIds)
      ? candidate.playerIds.filter((item): item is string => typeof item === 'string')
      : []
    const clubIds = Array.isArray(candidate.clubIds)
      ? candidate.clubIds.filter((item): item is string => typeof item === 'string')
      : []

    return { playerIds, clubIds }
  } catch (error) {
    console.error('Failed to parse catalog favorites.', error)
    return { playerIds: [], clubIds: [] }
  }
}

export function useCatalogFavorites(userId: string): UseCatalogFavoritesResult {
  const storageKey = useMemo(() => `catalog-favorites-${userId}`, [userId])
  const [favorites, setFavorites] = useState<CatalogFavorites>(() =>
    parseFavorites(localStorage.getItem(storageKey)),
  )

  const updateFavorites = (nextFavorites: CatalogFavorites) => {
    setFavorites(nextFavorites)
    localStorage.setItem(storageKey, JSON.stringify(nextFavorites))
  }

  const togglePlayerFavorite = (playerId: string) => {
    const exists = favorites.playerIds.includes(playerId)
    const playerIds = exists
      ? favorites.playerIds.filter((item) => item !== playerId)
      : [...favorites.playerIds, playerId]
    updateFavorites({ ...favorites, playerIds })
  }

  const toggleClubFavorite = (clubId: string) => {
    const exists = favorites.clubIds.includes(clubId)
    const clubIds = exists
      ? favorites.clubIds.filter((item) => item !== clubId)
      : [...favorites.clubIds, clubId]
    updateFavorites({ ...favorites, clubIds })
  }

  return {
    playerIds: favorites.playerIds,
    clubIds: favorites.clubIds,
    togglePlayerFavorite,
    toggleClubFavorite,
  }
}
