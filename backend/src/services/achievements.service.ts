import { supabase } from "../lib/supabase";
import { Achievement } from "../types/achievement";
import { HttpError } from "../utils/httpError";

const achievementFields = "id, player_id, title, event_date, place, rank, image_url, created_at";

interface CreateAchievementInput {
  playerId: string;
  title: string;
  eventDate: string;
  place: string | null;
  rank: string | null;
  imageUrl: string | null;
}

interface UpdateAchievementInput {
  title?: string;
  eventDate?: string;
  place?: string | null;
  rank?: string | null;
  imageUrl?: string | null;
}

export const listPlayerAchievements = async (playerId: string): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from("achievements")
    .select(achievementFields)
    .eq("player_id", playerId)
    .order("event_date", { ascending: false });

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Achievement[];
};

export const createAchievement = async (input: CreateAchievementInput): Promise<Achievement> => {
  const { data, error } = await supabase
    .from("achievements")
    .insert({
      player_id: input.playerId,
      title: input.title,
      event_date: input.eventDate,
      place: input.place,
      rank: input.rank,
      image_url: input.imageUrl
    })
    .select(achievementFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create achievement");
  }

  return data as Achievement;
};

export const updateAchievement = async (
  playerId: string,
  achievementId: string,
  input: UpdateAchievementInput
): Promise<Achievement> => {
  const payload: Record<string, string | null> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.eventDate !== undefined) payload.event_date = input.eventDate;
  if (input.place !== undefined) payload.place = input.place;
  if (input.rank !== undefined) payload.rank = input.rank;
  if (input.imageUrl !== undefined) payload.image_url = input.imageUrl;

  const { data, error } = await supabase
    .from("achievements")
    .update(payload)
    .eq("id", achievementId)
    .eq("player_id", playerId)
    .select(achievementFields)
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to update achievement");
  }

  return data as Achievement;
};

export const deleteAchievement = async (playerId: string, achievementId: string): Promise<void> => {
  const { data, error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", achievementId)
    .eq("player_id", playerId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new HttpError(400, error.message);
  }

  if (!data) {
    throw new HttpError(404, "Achievement not found for player");
  }
};
