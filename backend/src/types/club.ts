export type ClubStatus = "active" | "inactive";

export interface Club {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  status: ClubStatus;
  created_at: string;
}

export interface ClubStats {
  clubId: string;
  totalPlayers: number;
  activeContracts: number;
  totalContracts: number;
}
