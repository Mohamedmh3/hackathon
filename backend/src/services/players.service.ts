import { supabase } from "../lib/supabase";
import {
  Player,
  PlayerAchievement,
  PlayerClubHistoryEntry,
  PlayerContractSummary,
  PlayerProfile,
  PlayerStatus
} from "../types/player";
import { HttpError } from "../utils/httpError";

interface ListPlayersOptions {
  search?: string;
  sportId?: string;
  clubId?: string;
  status?: PlayerStatus;
  gender?: "male" | "female";
}

interface CreatePlayerInput {
  playerCode: string;
  fullName: string;
  sportId: string;
  currentClubId: string | null;
  enrollmentDate: string | null;
  birthDate: string;
  nationality: string;
  gender: "male" | "female";
  status: PlayerStatus;
  deathDate: string | null;
  photoUrl: string | null;
}

interface UpdatePlayerInput {
  fullName?: string;
  sportId?: string;
  currentClubId?: string | null;
  enrollmentDate?: string | null;
  birthDate?: string;
  nationality?: string;
  gender?: "male" | "female";
  deathDate?: string | null;
  photoUrl?: string | null;
}

interface ChangeStatusInput {
  newStatus: PlayerStatus;
  reason: string;
  changedBy: string;
  deathDate: string | null;
}

const playerSelectFields =
  "id, player_code, full_name, sport_id, current_club_id, enrollment_date, birth_date, nationality, gender, status, death_date, photo_url, created_at, updated_at";

export const listPlayers = async (options: ListPlayersOptions): Promise<Player[]> => {
  let query = supabase.from("players").select(playerSelectFields).order("created_at", { ascending: false });

  if (options.search) {
    query = query.or(`full_name.ilike.%${options.search}%,player_code.ilike.%${options.search}%`);
  }
  if (options.sportId) {
    query = query.eq("sport_id", options.sportId);
  }
  if (options.clubId) {
    query = query.eq("current_club_id", options.clubId);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  }
  if (options.gender) {
    query = query.eq("gender", options.gender);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Player[];
};

export const getPlayerById = async (playerId: string): Promise<Player> => {
  const { data, error } = await supabase.from("players").select(playerSelectFields).eq("id", playerId).single();
  if (error || !data) {
    throw new HttpError(404, "Player not found");
  }
  return data as Player;
};

export const createPlayer = async (input: CreatePlayerInput): Promise<Player> => {
  const { data, error } = await supabase
    .from("players")
    .insert({
      player_code: input.playerCode,
      full_name: input.fullName,
      sport_id: input.sportId,
      current_club_id: input.currentClubId,
      enrollment_date: input.enrollmentDate,
      birth_date: input.birthDate,
      nationality: input.nationality,
      gender: input.gender,
      status: input.status,
      death_date: input.deathDate,
      photo_url: input.photoUrl
    })
    .select(playerSelectFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create player");
  }

  return data as Player;
};

export const updatePlayer = async (playerId: string, input: UpdatePlayerInput): Promise<Player> => {
  const payload: Record<string, unknown> = {};
  if (input.fullName !== undefined) payload.full_name = input.fullName;
  if (input.sportId !== undefined) payload.sport_id = input.sportId;
  if (input.currentClubId !== undefined) payload.current_club_id = input.currentClubId;
  if (input.enrollmentDate !== undefined) payload.enrollment_date = input.enrollmentDate;
  if (input.birthDate !== undefined) payload.birth_date = input.birthDate;
  if (input.nationality !== undefined) payload.nationality = input.nationality;
  if (input.gender !== undefined) payload.gender = input.gender;
  if (input.deathDate !== undefined) payload.death_date = input.deathDate;
  if (input.photoUrl !== undefined) payload.photo_url = input.photoUrl;

  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", playerId)
    .select(playerSelectFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to update player");
  }

  return data as Player;
};

export const changePlayerStatus = async (
  playerId: string,
  input: ChangeStatusInput
): Promise<{ player: Player; oldStatus: PlayerStatus }> => {
  const currentPlayer = await getPlayerById(playerId);

  const { data: updatedPlayer, error: updateError } = await supabase
    .from("players")
    .update({
      status: input.newStatus,
      death_date: input.newStatus === "deceased" ? input.deathDate : null
    })
    .eq("id", playerId)
    .select(playerSelectFields)
    .single();

  if (updateError || !updatedPlayer) {
    throw new HttpError(400, updateError?.message ?? "Failed to change player status");
  }

  const { error: statusLogError } = await supabase.from("status_changes").insert({
    player_id: playerId,
    old_status: currentPlayer.status,
    new_status: input.newStatus,
    reason: input.reason,
    changed_by: input.changedBy
  });

  if (statusLogError) {
    throw new HttpError(500, statusLogError.message);
  }

  return {
    player: updatedPlayer as Player,
    oldStatus: currentPlayer.status
  };
};

export const getPlayerProfile = async (playerId: string): Promise<PlayerProfile> => {
  const [player, activeContractResult, historyResult, achievementsResult] = await Promise.all([
    getPlayerById(playerId),
    supabase
      .from("contracts")
      .select("id, club_id, start_date, end_date, status")
      .eq("player_id", playerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("player_club_history")
      .select("id, club_id, start_date, end_date, reason, created_at")
      .eq("player_id", playerId)
      .order("end_date", { ascending: false }),
    supabase
      .from("achievements")
      .select("id, title, event_date, place, rank, image_url, created_at")
      .eq("player_id", playerId)
      .order("event_date", { ascending: false })
  ]);

  if (activeContractResult.error) {
    throw new HttpError(500, activeContractResult.error.message);
  }
  if (historyResult.error) {
    throw new HttpError(500, historyResult.error.message);
  }
  if (achievementsResult.error) {
    throw new HttpError(500, achievementsResult.error.message);
  }

  return {
    player,
    activeContract: (activeContractResult.data as PlayerContractSummary | null) ?? null,
    history: (historyResult.data ?? []) as PlayerClubHistoryEntry[],
    achievements: (achievementsResult.data ?? []) as PlayerAchievement[]
  };
};
