import { useEffect, useMemo, useState } from 'react'
import type { CatalogSport } from '../data/publicCatalogData'
import {
  createClubRequest,
  createSportRequest,
  deleteSportRequest,
  getClubsRequest,
  getPlayersRequest,
  getSportsRequest,
  getStoredAuthToken,
  updateClubRequest,
  updateClubStatusRequest,
  updateSportRequest,
} from '../lib/api'
import type { ManagedClub, ClubFormInput } from '../types/clubSportManagement'

interface ClubStats {
  playersCount: number
  activeContractsCount: number
  achievementsCount: number
}

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function mapClubRecord(club: { id: string; name: string; city: string; status: 'active' | 'inactive' }): ManagedClub {
  return {
    id: club.id,
    name: club.name,
    city: club.city,
    status: club.status,
    sportIds: [],
  }
}

function mapSportRecord(sport: { id: string; name: string }): CatalogSport {
  return {
    id: sport.id,
    name: sport.name,
  }
}

export function useClubSportManagement() {
  const [clubs, setClubs] = useState<ManagedClub[]>([])
  const [sports, setSports] = useState<CatalogSport[]>([])
  const [playerSummary, setPlayerSummary] = useState<Array<{ currentClubId: string | null; status: string }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const accessToken = getStoredAuthToken()
    if (!accessToken) {
      setIsLoading(false)
      return
    }

    let isAlive = true
    setIsLoading(true)

    Promise.all([
      getClubsRequest(accessToken),
      getSportsRequest(accessToken),
      getPlayersRequest(accessToken),
    ])
      .then(([clubRecords, sportRecords, playerRecords]) => {
        if (!isAlive) {
          return
        }
        setClubs(clubRecords.map(mapClubRecord))
        setSports(sportRecords.map(mapSportRecord))
        setPlayerSummary(
          playerRecords.map((player) => ({
            currentClubId: player.current_club_id,
            status: player.status,
          })),
        )
      })
      .catch((error) => {
        console.error('Failed to load club and sport data from backend.', error)
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

  const clubMap = useMemo(
    () => new Map(clubs.map((club) => [club.id, club])),
    [clubs],
  )

  const createClub = (input: ClubFormInput) => {
    const nextClub: ManagedClub = {
      id: makeId('club'),
      name: input.name,
      city: input.city,
      status: input.status,
      sportIds: [],
    }

    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void createClubRequest({ name: input.name, city: input.city }, accessToken)
        .then((created) => {
          setClubs((prev) => [mapClubRecord(created), ...prev.filter((club) => club.id !== nextClub.id)])
        })
        .catch((error) => {
          console.error('Failed to create club via backend.', error)
        })
    }

    setClubs((prev) => [nextClub, ...prev])
    return nextClub
  }

  const updateClub = (clubId: string, input: ClubFormInput) => {
    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void updateClubRequest(clubId, { name: input.name, city: input.city }, accessToken)
        .catch((error) => {
          console.error('Failed to update club via backend.', error)
        })
    }

    setClubs((prev) =>
      prev.map((club) => (club.id === clubId ? { ...club, ...input } : club)),
    )
  }

  const toggleClubStatus = (clubId: string) => {
    const accessToken = getStoredAuthToken()
    const currentClub = clubs.find((club) => club.id === clubId)
    if (accessToken && currentClub) {
      void updateClubStatusRequest(
        clubId,
        currentClub.status === 'active' ? 'inactive' : 'active',
        accessToken,
      ).catch((error) => {
        console.error('Failed to update club status via backend.', error)
      })
    }

    setClubs((prev) =>
      prev.map((club) =>
        club.id === clubId
          ? {
              ...club,
              status: club.status === 'active' ? 'inactive' : 'active',
            }
          : club,
      ),
    )
  }

  const createSport = (name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) {
      console.error('Sport name is required.')
      return
    }

    const fallbackSport: CatalogSport = {
      id: makeId('sport'),
      name: normalizedName,
    }

    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void createSportRequest({ name: normalizedName }, accessToken)
        .then((created) => {
          setSports((prev) => [mapSportRecord(created), ...prev.filter((sport) => sport.id !== fallbackSport.id)])
        })
        .catch((error) => {
          console.error('Failed to create sport via backend.', error)
        })
    }

    setSports((prev) => [fallbackSport, ...prev])
  }

  const updateSport = (sportId: string, name: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) {
      console.error('Sport name is required.')
      return
    }

    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void updateSportRequest(sportId, { name: normalizedName }, accessToken).catch((error) => {
        console.error('Failed to update sport via backend.', error)
      })
    }

    setSports((prev) =>
      prev.map((sport) =>
        sport.id === sportId ? { ...sport, name: normalizedName } : sport,
      ),
    )
  }

  const deleteSport = (sportId: string) => {
    const accessToken = getStoredAuthToken()
    if (accessToken) {
      void deleteSportRequest(sportId, accessToken).catch((error) => {
        console.error('Failed to delete sport via backend.', error)
      })
    }

    setSports((prev) => prev.filter((sport) => sport.id !== sportId))
    setClubs((prev) =>
      prev.map((club) => ({
        ...club,
        sportIds: club.sportIds.filter((id) => id !== sportId),
      })),
    )
  }

  const setClubSportLink = (clubId: string, sportId: string, linked: boolean) => {
    setClubs((prev) =>
      prev.map((club) => {
        if (club.id !== clubId) {
          return club
        }

        const hasSport = club.sportIds.includes(sportId)
        if (linked && !hasSport) {
          return { ...club, sportIds: [...club.sportIds, sportId] }
        }
        if (!linked && hasSport) {
          return { ...club, sportIds: club.sportIds.filter((id) => id !== sportId) }
        }
        return club
      }),
    )
  }

  const clubStats = useMemo(() => {
    const stats = new Map<string, ClubStats>()
    clubs.forEach((club) => {
      const clubPlayers = playerSummary.filter(
        (player) => player.currentClubId === club.id,
      )
      const playersCount = clubPlayers.length
      const activeContractsCount = clubPlayers.filter(
        (player) => player.status === 'active',
      ).length
      const achievementsCount = 0
      stats.set(club.id, { playersCount, activeContractsCount, achievementsCount })
    })
    return stats
  }, [clubs, playerSummary])

  return {
    clubs,
    sports,
    clubMap,
    clubStats,
    isLoading,
    createClub,
    updateClub,
    toggleClubStatus,
    createSport,
    updateSport,
    deleteSport,
    setClubSportLink,
  }
}
