export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

interface RegisterPayload {
  email: string
  password: string
  fullName: string
}

interface LoginPayload {
  email: string
  password: string
}

interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

interface UserProfileResponse {
  id: string
  email: string
  profile: {
    full_name: string | null
    role: string
    club_id: string | null
    player_id: string | null
  }
}

export interface PublicPlayerApiRecord {
  id: string
  player_code: string
  full_name: string
  nationality: string
  gender: 'male' | 'female'
  status: 'active' | 'retired' | 'free' | 'deceased'
  photo_url: string | null
  sport: {
    id: string
    name: string
  } | null
  club: {
    id: string
    name: string
    city: string
    logo_url: string | null
  } | null
}

export interface PublicClubApiRecord {
  id: string
  name: string
  city: string
  logo_url: string | null
  status: 'active' | 'inactive'
}

export interface ClubApiRecord {
  id: string
  name: string
  city: string
  logo_url: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface SportApiRecord {
  id: string
  name: string
  icon_url: string | null
  created_at: string
}

export interface PlayerApiRecord {
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
  created_at: string
  updated_at: string
}

export interface DashboardOverviewApiRecord {
  totalPlayers: number
  totalClubs: number
  activeContracts: number
  contractsExpiringSoon: number
}

export interface DashboardLabeledCountApiRecord {
  key: string
  label: string
  count: number
}

export interface ContractApiRecord {
  id: string
  player_id: string
  club_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'terminated' | 'transferred'
  termination_reason: string | null
  notes: string | null
  created_by: string
  created_at: string
}

const configuredBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const API_BASE_URL = configuredBase.endsWith('/')
  ? configuredBase.slice(0, -1)
  : configuredBase

const buildUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`)
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem('player-membership-auth-session')
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { accessToken?: string }
    return typeof parsed.accessToken === 'string' ? parsed.accessToken : null
  } catch {
    return null
  }
}

async function requestJson<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
    accessToken?: string
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  let payload: ApiEnvelope<T>
  try {
    payload = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(response.status, 'Invalid server response')
  }

  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new ApiError(response.status, payload.error ?? 'Request failed')
  }

  return payload.data
}

export async function registerRequest(payload: RegisterPayload): Promise<void> {
  await requestJson<{ userId: string; email: string; role: string }>('/api/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  return requestJson<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function getMeRequest(accessToken: string): Promise<UserProfileResponse> {
  return requestJson<UserProfileResponse>('/api/auth/me', {
    accessToken,
  })
}

export async function getClubsRequest(accessToken: string): Promise<ClubApiRecord[]> {
  return requestJson<ClubApiRecord[]>('/api/clubs', { accessToken })
}

export async function createClubRequest(
  payload: { name: string; city: string; logoUrl?: string | null },
  accessToken: string,
): Promise<ClubApiRecord> {
  return requestJson<ClubApiRecord>('/api/clubs', {
    method: 'POST',
    body: payload,
    accessToken,
  })
}

export async function updateClubRequest(
  clubId: string,
  payload: { name?: string; city?: string; logoUrl?: string | null },
  accessToken: string,
): Promise<ClubApiRecord> {
  return requestJson<ClubApiRecord>(`/api/clubs/${clubId}`, {
    method: 'PATCH',
    body: payload,
    accessToken,
  })
}

export async function updateClubStatusRequest(
  clubId: string,
  status: 'active' | 'inactive',
  accessToken: string,
): Promise<ClubApiRecord> {
  return requestJson<ClubApiRecord>(`/api/clubs/${clubId}/status`, {
    method: 'PATCH',
    body: { status },
    accessToken,
  })
}

export async function getSportsRequest(accessToken: string): Promise<SportApiRecord[]> {
  return requestJson<SportApiRecord[]>('/api/sports', { accessToken })
}

export async function createSportRequest(
  payload: { name: string; iconUrl?: string | null },
  accessToken: string,
): Promise<SportApiRecord> {
  return requestJson<SportApiRecord>('/api/sports', {
    method: 'POST',
    body: payload,
    accessToken,
  })
}

export async function updateSportRequest(
  sportId: string,
  payload: { name?: string; iconUrl?: string | null },
  accessToken: string,
): Promise<SportApiRecord> {
  return requestJson<SportApiRecord>(`/api/sports/${sportId}`, {
    method: 'PATCH',
    body: payload,
    accessToken,
  })
}

export async function deleteSportRequest(sportId: string, accessToken: string): Promise<void> {
  await requestJson<null>(`/api/sports/${sportId}`, {
    method: 'DELETE',
    accessToken,
  })
}

export async function getPlayersRequest(accessToken: string): Promise<PlayerApiRecord[]> {
  return requestJson<PlayerApiRecord[]>('/api/players', { accessToken })
}

export async function createPlayerRequest(
  payload: {
    playerCode: string
    fullName: string
    sportId: string
    currentClubId?: string | null
    enrollmentDate?: string | null
    birthDate: string
    nationality: string
    gender: 'male' | 'female'
    status?: 'active' | 'retired' | 'free' | 'deceased'
    deathDate?: string | null
    photoUrl?: string | null
  },
  accessToken: string,
): Promise<PlayerApiRecord> {
  return requestJson<PlayerApiRecord>('/api/players', {
    method: 'POST',
    body: payload,
    accessToken,
  })
}

export async function updatePlayerRequest(
  playerId: string,
  payload: {
    fullName?: string
    sportId?: string
    currentClubId?: string | null
    enrollmentDate?: string | null
    birthDate?: string
    nationality?: string
    gender?: 'male' | 'female'
    deathDate?: string | null
    photoUrl?: string | null
  },
  accessToken: string,
): Promise<PlayerApiRecord> {
  return requestJson<PlayerApiRecord>(`/api/players/${playerId}`, {
    method: 'PATCH',
    body: payload,
    accessToken,
  })
}

export async function changePlayerStatusRequest(
  playerId: string,
  payload: { status: 'active' | 'retired' | 'free' | 'deceased'; reason: string; deathDate?: string | null },
  accessToken: string,
): Promise<{ player: PlayerApiRecord; oldStatus: string }> {
  return requestJson<{ player: PlayerApiRecord; oldStatus: string }>(`/api/players/${playerId}/status`, {
    method: 'PATCH',
    body: payload,
    accessToken,
  })
}

export async function getPublicPlayersRequest(): Promise<PublicPlayerApiRecord[]> {
  return requestJson<PublicPlayerApiRecord[]>('/api/public/players')
}

export async function getPublicClubsRequest(): Promise<PublicClubApiRecord[]> {
  return requestJson<PublicClubApiRecord[]>('/api/public/clubs')
}

export async function getDashboardOverviewRequest(
  accessToken: string,
  days = 30,
): Promise<DashboardOverviewApiRecord> {
  return requestJson<DashboardOverviewApiRecord>(`/api/dashboard/overview?days=${days}`, {
    accessToken,
  })
}

export async function getDashboardPlayersByStatusRequest(
  accessToken: string,
): Promise<DashboardLabeledCountApiRecord[]> {
  return requestJson<DashboardLabeledCountApiRecord[]>('/api/dashboard/players-by-status', {
    accessToken,
  })
}

export async function getDashboardPlayersBySportRequest(
  accessToken: string,
): Promise<DashboardLabeledCountApiRecord[]> {
  return requestJson<DashboardLabeledCountApiRecord[]>('/api/dashboard/players-by-sport', {
    accessToken,
  })
}

export async function getDashboardPlayersByClubRequest(
  accessToken: string,
): Promise<DashboardLabeledCountApiRecord[]> {
  return requestJson<DashboardLabeledCountApiRecord[]>('/api/dashboard/players-by-club', {
    accessToken,
  })
}

export async function getDashboardContractsExpiringRequest(
  accessToken: string,
  days = 30,
): Promise<DashboardLabeledCountApiRecord[]> {
  return requestJson<DashboardLabeledCountApiRecord[]>(`/api/dashboard/contracts-expiring?days=${days}`, {
    accessToken,
  })
}

export async function getExpiringContractsRequest(
  accessToken: string,
  days = 30,
): Promise<ContractApiRecord[]> {
  return requestJson<ContractApiRecord[]>(`/api/contracts/expiring/soon?days=${days}`, {
    accessToken,
  })
}
