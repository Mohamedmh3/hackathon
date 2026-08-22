import { supabase } from "../lib/supabase";
import { Club, ClubStats, ClubStatus } from "../types/club";
import { HttpError } from "../utils/httpError";

interface ListClubsOptions {
  search?: string;
  status?: ClubStatus;
}

interface CreateClubInput {
  name: string;
  city: string;
  logoUrl: string | null;
}

interface UpdateClubInput {
  name?: string;
  city?: string;
  logoUrl?: string | null;
}

const getCountOrZero = (count: number | null): number => count ?? 0;

export const listClubs = async (options: ListClubsOptions): Promise<Club[]> => {
  let query = supabase
    .from("clubs")
    .select("id, name, logo_url, city, status, created_at")
    .order("created_at", { ascending: false });

  if (options.search) {
    query = query.ilike("name", `%${options.search}%`);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as Club[];
};

export const createClub = async (input: CreateClubInput): Promise<Club> => {
  const { data, error } = await supabase
    .from("clubs")
    .insert({
      name: input.name,
      city: input.city,
      logo_url: input.logoUrl,
      status: "active"
    })
    .select("id, name, logo_url, city, status, created_at")
    .single();

  if (error || !data) {
    throw new HttpError(400, error?.message ?? "Failed to create club");
  }

  return data as Club;
};

export const updateClub = async (clubId: string, input: UpdateClubInput): Promise<Club> => {
  const updatePayload: { name?: string; city?: string; logo_url?: string | null } = {};

  if (input.name !== undefined) {
    updatePayload.name = input.name;
  }
  if (input.city !== undefined) {
    updatePayload.city = input.city;
  }
  if (input.logoUrl !== undefined) {
    updatePayload.logo_url = input.logoUrl;
  }

  const { data, error } = await supabase
    .from("clubs")
    .update(updatePayload)
    .eq("id", clubId)
    .select("id, name, logo_url, city, status, created_at")
    .single();

  if (error) {
    throw new HttpError(400, error.message);
  }

  if (!data) {
    throw new HttpError(404, "Club not found");
  }

  return data as Club;
};

export const updateClubStatus = async (clubId: string, status: ClubStatus): Promise<Club> => {
  const { data, error } = await supabase
    .from("clubs")
    .update({ status })
    .eq("id", clubId)
    .select("id, name, logo_url, city, status, created_at")
    .single();

  if (error) {
    throw new HttpError(400, error.message);
  }

  if (!data) {
    throw new HttpError(404, "Club not found");
  }

  return data as Club;
};

export const getClubStats = async (clubId: string): Promise<ClubStats> => {
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("id", clubId)
    .single();

  if (clubError || !club) {
    throw new HttpError(404, "Club not found");
  }

  const [playersResult, activeContractsResult, totalContractsResult] = await Promise.all([
    supabase
      .from("players")
      .select("id", { head: true, count: "exact" })
      .eq("current_club_id", clubId),
    supabase
      .from("contracts")
      .select("id", { head: true, count: "exact" })
      .eq("club_id", clubId)
      .eq("status", "active"),
    supabase.from("contracts").select("id", { head: true, count: "exact" }).eq("club_id", clubId)
  ]);

  if (playersResult.error) {
    throw new HttpError(500, playersResult.error.message);
  }
  if (activeContractsResult.error) {
    throw new HttpError(500, activeContractsResult.error.message);
  }
  if (totalContractsResult.error) {
    throw new HttpError(500, totalContractsResult.error.message);
  }

  return {
    clubId,
    totalPlayers: getCountOrZero(playersResult.count),
    activeContracts: getCountOrZero(activeContractsResult.count),
    totalContracts: getCountOrZero(totalContractsResult.count)
  };
};
