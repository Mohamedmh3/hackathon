-- MVP schema for Player Enrollment System
-- Run in Supabase SQL editor

create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  city text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  player_code text not null unique,
  full_name text not null,
  sport_id uuid not null references public.sports(id),
  current_club_id uuid references public.clubs(id),
  enrollment_date date,
  birth_date date not null,
  nationality text not null,
  gender text not null check (gender in ('male', 'female')),
  status text not null default 'active' check (status in ('active', 'retired', 'free', 'deceased')),
  death_date date,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'public' check (role in ('admin', 'club_staff', 'player', 'public')),
  club_id uuid references public.clubs(id),
  player_id uuid unique references public.players(id),
  created_at timestamptz not null default now()
);

create table if not exists public.club_sports (
  club_id uuid not null references public.clubs(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  primary key (club_id, sport_id)
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  club_id uuid not null references public.clubs(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated', 'transferred')),
  termination_reason text,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.player_club_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  club_id uuid not null references public.clubs(id),
  start_date date not null,
  end_date date not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.status_changes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  old_status text not null check (old_status in ('active', 'retired', 'free', 'deceased')),
  new_status text not null check (new_status in ('active', 'retired', 'free', 'deceased')),
  reason text not null,
  changed_by uuid not null references public.users(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  doc_type text not null check (doc_type in ('id', 'passport', 'birth_certificate', 'contract', 'other')),
  file_url text not null,
  uploaded_by uuid not null references public.users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  title text not null,
  event_date date not null,
  place text,
  rank text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((player_id is not null) or (club_id is not null))
);

create unique index if not exists favorites_user_player_unique
  on public.favorites(user_id, player_id)
  where player_id is not null;

create unique index if not exists favorites_user_club_unique
  on public.favorites(user_id, club_id)
  where club_id is not null;

create index if not exists idx_players_current_club_id on public.players(current_club_id);
create index if not exists idx_players_sport_id on public.players(sport_id);
create index if not exists idx_players_status on public.players(status);
create index if not exists idx_contracts_player_id on public.contracts(player_id);
create index if not exists idx_contracts_club_id on public.contracts(club_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_end_date on public.contracts(end_date);
create index if not exists idx_history_player_id on public.player_club_history(player_id);
create index if not exists idx_documents_player_id on public.documents(player_id);
create index if not exists idx_achievements_player_id on public.achievements(player_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_players_set_updated_at on public.players;
create trigger trg_players_set_updated_at
before update on public.players
for each row
execute function public.set_updated_at();
