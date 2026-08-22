export const USER_ROLES = ["admin", "club_staff", "player", "public"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  club_id: string | null;
  player_id: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  clubId: string | null;
  playerId: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterInput extends AuthCredentials {
  fullName: string;
}
