import type { PublicCatalogClub, PublicCatalogPlayer } from '../types/domain'

export interface CatalogSport {
  id: string
  name: string
}

export const CATALOG_SPORTS: CatalogSport[] = [
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'swimming', name: 'Swimming' },
]

export const CATALOG_CLUBS: PublicCatalogClub[] = [
  {
    id: 'club-1',
    name: 'Al Ahly Club',
    city: 'Cairo',
    sportIds: ['football', 'basketball'],
    status: 'active',
  },
  {
    id: 'club-2',
    name: 'Zamalek Club',
    city: 'Giza',
    sportIds: ['football', 'volleyball'],
    status: 'active',
  },
  {
    id: 'club-3',
    name: 'Alex Sharks',
    city: 'Alexandria',
    sportIds: ['swimming', 'volleyball'],
    status: 'active',
  },
]

export const CATALOG_PLAYERS: PublicCatalogPlayer[] = [
  {
    id: 'player-1',
    fullName: 'Karim Hassan',
    sportId: 'football',
    currentClubId: 'club-1',
    status: 'active',
    gender: 'male',
    nationality: 'Egyptian',
  },
  {
    id: 'player-2',
    fullName: 'Mariam Adel',
    sportId: 'basketball',
    currentClubId: 'club-1',
    status: 'active',
    gender: 'female',
    nationality: 'Egyptian',
  },
  {
    id: 'player-3',
    fullName: 'Youssef Salah',
    sportId: 'football',
    currentClubId: 'club-2',
    status: 'free',
    gender: 'male',
    nationality: 'Egyptian',
  },
  {
    id: 'player-4',
    fullName: 'Sara Mahmoud',
    sportId: 'volleyball',
    currentClubId: 'club-2',
    status: 'retired',
    gender: 'female',
    nationality: 'Egyptian',
  },
  {
    id: 'player-5',
    fullName: 'Omar Nabil',
    sportId: 'swimming',
    currentClubId: 'club-3',
    status: 'active',
    gender: 'male',
    nationality: 'Egyptian',
  },
]
