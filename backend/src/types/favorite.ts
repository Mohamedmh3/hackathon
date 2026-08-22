export interface Favorite {
  id: string;
  user_id: string;
  player_id: string | null;
  club_id: string | null;
  created_at: string;
}

export interface FavoriteWithDetails extends Favorite {
  player: {
    id: string;
    full_name: string;
    player_code: string;
    status: string;
    photo_url: string | null;
  } | null;
  club: {
    id: string;
    name: string;
    city: string;
    logo_url: string | null;
    status: string;
  } | null;
}
