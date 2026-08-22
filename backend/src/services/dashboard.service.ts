import { supabase } from "../lib/supabase";
import { DashboardOverview, LabeledCount } from "../types/dashboard";
import { HttpError } from "../utils/httpError";

const getCountOrZero = (count: number | null): number => count ?? 0;

const getExpiringRange = (days: number): { startDate: string; endDate: string } => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + days);
  return {
    startDate: now.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  };
};

export const getDashboardOverview = async (clubId: string | undefined, days: number): Promise<DashboardOverview> => {
  const { startDate, endDate } = getExpiringRange(days);

  const playersQuery = supabase.from("players").select("id", { head: true, count: "exact" });
  const clubsQuery = clubId
    ? supabase.from("clubs").select("id", { head: true, count: "exact" }).eq("id", clubId)
    : supabase.from("clubs").select("id", { head: true, count: "exact" });
  const activeContractsQuery = supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .eq("status", "active");
  const expiringContractsQuery = supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .eq("status", "active")
    .gte("end_date", startDate)
    .lte("end_date", endDate);

  if (clubId) {
    playersQuery.eq("current_club_id", clubId);
    activeContractsQuery.eq("club_id", clubId);
    expiringContractsQuery.eq("club_id", clubId);
  }

  const [playersResult, clubsResult, activeContractsResult, expiringResult] = await Promise.all([
    playersQuery,
    clubsQuery,
    activeContractsQuery,
    expiringContractsQuery
  ]);

  if (playersResult.error) throw new HttpError(500, playersResult.error.message);
  if (clubsResult.error) throw new HttpError(500, clubsResult.error.message);
  if (activeContractsResult.error) throw new HttpError(500, activeContractsResult.error.message);
  if (expiringResult.error) throw new HttpError(500, expiringResult.error.message);

  return {
    totalPlayers: getCountOrZero(playersResult.count),
    totalClubs: getCountOrZero(clubsResult.count),
    activeContracts: getCountOrZero(activeContractsResult.count),
    contractsExpiringSoon: getCountOrZero(expiringResult.count)
  };
};

export const getPlayersByStatusStats = async (clubId: string | undefined): Promise<LabeledCount[]> => {
  let query = supabase.from("players").select("status");
  if (clubId) {
    query = query.eq("current_club_id", clubId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const status = row.status as string;
    buckets.set(status, (buckets.get(status) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([status, count]) => ({
    key: status,
    label: status,
    count
  }));
};

export const getPlayersBySportStats = async (clubId: string | undefined): Promise<LabeledCount[]> => {
  let playersQuery = supabase.from("players").select("sport_id");
  if (clubId) {
    playersQuery = playersQuery.eq("current_club_id", clubId);
  }

  const { data: players, error: playersError } = await playersQuery;
  if (playersError) {
    throw new HttpError(500, playersError.message);
  }

  const sportCount = new Map<string, number>();
  for (const row of players ?? []) {
    const sportId = row.sport_id as string | null;
    if (!sportId) {
      continue;
    }
    sportCount.set(sportId, (sportCount.get(sportId) ?? 0) + 1);
  }

  const sportIds = Array.from(sportCount.keys());
  if (sportIds.length === 0) {
    return [];
  }

  const { data: sports, error: sportsError } = await supabase.from("sports").select("id, name").in("id", sportIds);
  if (sportsError) {
    throw new HttpError(500, sportsError.message);
  }

  const nameById = new Map<string, string>((sports ?? []).map((sport) => [sport.id as string, sport.name as string]));

  return sportIds.map((sportId) => ({
    key: sportId,
    label: nameById.get(sportId) ?? "Unknown Sport",
    count: sportCount.get(sportId) ?? 0
  }));
};

export const getPlayersByClubStats = async (clubId: string | undefined): Promise<LabeledCount[]> => {
  if (clubId) {
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("id", clubId)
      .single();
    if (clubError || !club) {
      throw new HttpError(404, "Club not found");
    }

    const { count, error: countError } = await supabase
      .from("players")
      .select("id", { head: true, count: "exact" })
      .eq("current_club_id", clubId);
    if (countError) {
      throw new HttpError(500, countError.message);
    }

    return [
      {
        key: club.id as string,
        label: club.name as string,
        count: getCountOrZero(count)
      }
    ];
  }

  const { data: players, error: playersError } = await supabase.from("players").select("current_club_id");
  if (playersError) {
    throw new HttpError(500, playersError.message);
  }

  const clubCount = new Map<string, number>();
  for (const row of players ?? []) {
    const currentClubId = row.current_club_id as string | null;
    if (!currentClubId) {
      continue;
    }
    clubCount.set(currentClubId, (clubCount.get(currentClubId) ?? 0) + 1);
  }

  const clubIds = Array.from(clubCount.keys());
  if (clubIds.length === 0) {
    return [];
  }

  const { data: clubs, error: clubsError } = await supabase.from("clubs").select("id, name").in("id", clubIds);
  if (clubsError) {
    throw new HttpError(500, clubsError.message);
  }

  const nameById = new Map<string, string>((clubs ?? []).map((club) => [club.id as string, club.name as string]));

  return clubIds.map((id) => ({
    key: id,
    label: nameById.get(id) ?? "Unknown Club",
    count: clubCount.get(id) ?? 0
  }));
};

export const getExpiringContractsStats = async (clubId: string | undefined, days: number): Promise<LabeledCount[]> => {
  const { startDate, endDate } = getExpiringRange(days);

  let query = supabase
    .from("contracts")
    .select("id, end_date, club_id")
    .eq("status", "active")
    .gte("end_date", startDate)
    .lte("end_date", endDate)
    .order("end_date", { ascending: true });

  if (clubId) {
    query = query.eq("club_id", clubId);
  }

  const { data, error } = await query;
  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []).map((row) => ({
    key: row.id as string,
    label: `${row.end_date as string}`,
    count: 1
  }));
};
