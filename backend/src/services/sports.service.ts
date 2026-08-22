import { supabase } from "../lib/supabase";
import { Sport } from "../types/sport";
import { HttpError } from "../utils/httpError";

interface CreateSportInput {
  name: string;
  iconUrl: string | null;
}

interface UpdateSportInput {
  name?: string;
  iconUrl?: string | null;
}

export const listSports = async (search?: string): Promise<Sport[]> => {
  let query = supabase
    .from("sports")
    .select("id, name, icon_url, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Sport[];
};

export const createSport = async (input: CreateSportInput): Promise<Sport> => {
  const { data, error } = await supabase
    .from("sports")
    .insert({
      name: input.name,
      icon_url: input.iconUrl
    })
    .select("id, name, icon_url, created_at")
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create sport");
  }

  return data as Sport;
};

export const updateSport = async (sportId: string, input: UpdateSportInput): Promise<Sport> => {
  const payload: { name?: string; icon_url?: string | null } = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.iconUrl !== undefined) {
    payload.icon_url = input.iconUrl;
  }

  const { data, error } = await supabase
    .from("sports")
    .update(payload)
    .eq("id", sportId)
    .select("id, name, icon_url, created_at")
    .single();

  if (error) {
    throw new HttpError(400, error.message);
  }

  if (!data) {
    throw new HttpError(404, "Sport not found");
  }

  return data as Sport;
};

export const deleteSport = async (sportId: string): Promise<void> => {
  const { error } = await supabase.from("sports").delete().eq("id", sportId);
  if (error) {
    throw new HttpError(400, error.message);
  }
};
