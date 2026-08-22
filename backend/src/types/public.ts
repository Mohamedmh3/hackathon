export interface PublicPlayer {
  id: string;
  player_code: string;
  full_name: string;
  nationality: string;
  gender: string;
  status: string;
  photo_url: string | null;
  sport: {
    id: string;
    name: string;
  } | null;
  club: {
    id: string;
    name: string;
    city: string;
    logo_url: string | null;
  } | null;
}

export interface PublicClub {
  id: string;
  name: string;
  city: string;
  logo_url: string | null;
  status: string;
}
