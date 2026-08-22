export interface ClubSportItem {
  id: string
  name: string
}

export interface ManagedClub {
  id: string
  name: string
  city: string
  status: 'active' | 'inactive'
  sportIds: string[]
}

export interface ClubFormInput {
  name: string
  city: string
  status: 'active' | 'inactive'
}
