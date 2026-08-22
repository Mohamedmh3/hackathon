export interface Achievement {
  id: string;
  player_id: string;
  title: string;
  event_date: string;
  place: string | null;
  rank: string | null;
  image_url: string | null;
  created_at: string;
}
