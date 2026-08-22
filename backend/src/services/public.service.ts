import { supabase } from "../lib/supabase";
import { PublicClub, PublicPlayer } from "../types/public";
import { HttpError } from "../utils/httpError";

interface ListPublicPlayersOptions {
  search?: string;
  gender?: "male" | "female";
  sportId?: string;
  clubId?: string;
  status?: "active" | "retired" | "free" | "deceased";
  nationality?: string;
  minAge?: number;
  maxAge?: number;
}

interface ListPublicClubsOptions {
  search?: string;
  city?: string;
  status?: "active" | "inactive";
}

const dateToIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

export const listPublicPlayers = async (options: ListPublicPlayersOptions): Promise<PublicPlayer[]> => {
  let query = supabase
    .from("players")
    .select(
      "id, player_code, full_name, nationality, gender, status, photo_url, sports(id, name), clubs(id, name, city, logo_url)"
    )
    .order("full_name", { ascending: true });

  if (options.search) {
    query = query.or(`full_name.ilike.%${options.search}%,player_code.ilike.%${options.search}%`);
  }
  if (options.gender) {
    query = query.eq("gender", options.gender);
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
  if (options.nationality) {
    query = query.ilike("nationality", `%${options.nationality}%`);
  }

  const today = new Date();
  if (options.minAge !== undefined) {
    const latestBirthDate = new Date(today);
    latestBirthDate.setFullYear(today.getFullYear() - options.minAge);
    query = query.lte("birth_date", dateToIsoDate(latestBirthDate));
  }

  if (options.maxAge !== undefined) {
    const earliestBirthDate = new Date(today);
    earliestBirthDate.setFullYear(today.getFullYear() - (options.maxAge + 1));
    earliestBirthDate.setDate(earliestBirthDate.getDate() + 1);
    query = query.gte("birth_date", dateToIsoDate(earliestBirthDate));
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    player_code: row.player_code as string,
    full_name: row.full_name as string,
    nationality: row.nationality as string,
    gender: row.gender as string,
    status: row.status as string,
    photo_url: row.photo_url as string | null,
    sport: Array.isArray(row.sports)
      ? row.sports.length > 0
        ? {
            id: row.sports[0].id as string,
            name: row.sports[0].name as string
          }
        : null
      : row.sports
        ? {
            id: (row.sports as { id: string }).id,
            name: (row.sports as { name: string }).name
          }
        : null,
    club: Array.isArray(row.clubs)
      ? row.clubs.length > 0
        ? {
            id: row.clubs[0].id as string,
            name: row.clubs[0].name as string,
            city: row.clubs[0].city as string,
            logo_url: row.clubs[0].logo_url as string | null
          }
        : null
      : row.clubs
        ? {
            id: (row.clubs as { id: string }).id,
            name: (row.clubs as { name: string }).name,
            city: (row.clubs as { city: string }).city,
            logo_url: (row.clubs as { logo_url: string | null }).logo_url
          }
        : null
  }));
};

export const listPublicClubs = async (options: ListPublicClubsOptions): Promise<PublicClub[]> => {
  let query = supabase
    .from("clubs")
    .select("id, name, city, logo_url, status")
    .order("name", { ascending: true });

  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }
  if (options.city) {
    query = query.ilike("city", `%${options.city}%`);
  }
  if (options.status) {
    query = query.eq("status", options.status);
  } else {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as PublicClub[];
};
