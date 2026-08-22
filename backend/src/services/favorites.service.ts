import { supabase } from "../lib/supabase";
import { Favorite, FavoriteWithDetails } from "../types/favorite";
import { HttpError } from "../utils/httpError";

interface CreateFavoriteInput {
  userId: string;
  playerId: string | null;
  clubId: string | null;
}

const favoriteSelectWithRelations = `
  id,
  user_id,
  player_id,
  club_id,
  created_at,
  players(id, full_name, player_code, status, photo_url),
  clubs(id, name, city, logo_url, status)
`;

const mapFavorite = (row: Record<string, unknown>): FavoriteWithDetails => {
  const playerRaw = row.players as Record<string, unknown> | Record<string, unknown>[] | null;
  const clubRaw = row.clubs as Record<string, unknown> | Record<string, unknown>[] | null;

  const playerObject = Array.isArray(playerRaw) ? playerRaw[0] ?? null : playerRaw;
  const clubObject = Array.isArray(clubRaw) ? clubRaw[0] ?? null : clubRaw;

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    player_id: row.player_id as string | null,
    club_id: row.club_id as string | null,
    created_at: row.created_at as string,
    player: playerObject
      ? {
          id: playerObject.id as string,
          full_name: playerObject.full_name as string,
          player_code: playerObject.player_code as string,
          status: playerObject.status as string,
          photo_url: playerObject.photo_url as string | null
        }
      : null,
    club: clubObject
      ? {
          id: clubObject.id as string,
          name: clubObject.name as string,
          city: clubObject.city as string,
          logo_url: clubObject.logo_url as string | null,
          status: clubObject.status as string
        }
      : null
  };
};

export const listFavorites = async (userId: string): Promise<FavoriteWithDetails[]> => {
  const { data, error } = await supabase
    .from("favorites")
    .select(favoriteSelectWithRelations)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []).map((row) => mapFavorite(row as Record<string, unknown>));
};

export const createFavorite = async (input: CreateFavoriteInput): Promise<Favorite> => {
  const { data, error } = await supabase
    .from("favorites")
    .insert({
      user_id: input.userId,
      player_id: input.playerId,
      club_id: input.clubId
    })
    .select("id, user_id, player_id, club_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "Favorite already exists");
    }
    throw new HttpError(400, error.message);
  }
  if (!data) {
    throw new HttpError(500, "Failed to create favorite");
  }

  return data as Favorite;
};

export const deleteFavorite = async (userId: string, favoriteId: string): Promise<void> => {
  const { data, error } = await supabase
    .from("favorites")
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new HttpError(400, error.message);
  }
  if (!data) {
    throw new HttpError(404, "Favorite not found");
  }
};
