export type PlayerGender = "male" | "female";
export type PlayerStatus = "active" | "retired" | "free" | "deceased";

export interface Player {
  id: string;
  player_code: string;
  full_name: string;
  sport_id: string;
  current_club_id: string | null;
  enrollment_date: string | null;
  birth_date: string;
  nationality: string;
  gender: PlayerGender;
  status: PlayerStatus;
  death_date: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerContractSummary {
  id: string;
  club_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "terminated" | "transferred";
}

export interface PlayerClubHistoryEntry {
  id: string;
  club_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

export interface PlayerAchievement {
  id: string;
  title: string;
  event_date: string;
  place: string | null;
  rank: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PlayerProfile {
  player: Player;
  activeContract: PlayerContractSummary | null;
  history: PlayerClubHistoryEntry[];
  achievements: PlayerAchievement[];
}
