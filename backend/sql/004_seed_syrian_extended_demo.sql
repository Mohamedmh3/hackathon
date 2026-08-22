-- Phase: Extended Syrian demo data
-- Run this after:
-- 1) 001_mvp_schema.sql
-- 2) 002_transfer_flow_function.sql
-- 3) 003_seed_syrian_mock_data.sql
--
-- Purpose:
-- - Add more Syrian clubs
-- - Add additional demo players
-- - Demonstrate mixed player statuses (active/free/retired/deceased)
-- - Add history, status_changes, achievements, documents
-- - Add optional favorites for the first available user
--
-- NOTE:
-- This is mock/demo data for hackathon presentation, not an official federation roster.

begin;

-- 1) More Syrian clubs for richer browsing/filtering
insert into public.clubs (name, logo_url, city, status)
values
  ('Al-Wathba', null, 'Homs', 'active'),
  ('Al-Shorta Damascus', null, 'Damascus', 'active'),
  ('Hama FC', null, 'Hama', 'active')
on conflict (name) do update
set
  city = excluded.city,
  status = excluded.status;

-- 2) Link these clubs to football
with football as (
  select id from public.sports where name = 'Football'
),
new_clubs as (
  select id as club_id
  from public.clubs
  where name in ('Al-Wathba', 'Al-Shorta Damascus', 'Hama FC')
)
insert into public.club_sports (club_id, sport_id)
select c.club_id, f.id
from new_clubs c
cross join football f
on conflict do nothing;

-- 3) Add extended demo players (mix of statuses)
insert into public.players (
  player_code,
  full_name,
  sport_id,
  current_club_id,
  enrollment_date,
  birth_date,
  nationality,
  gender,
  status,
  death_date,
  photo_url
)
select
  p.player_code,
  p.full_name,
  s.id,
  c.id,
  p.enrollment_date::date,
  p.birth_date::date,
  'Syrian',
  p.gender,
  p.status,
  p.death_date::date,
  null
from (
  values
    ('SYR-PLR-0101', 'Demo Syrian Player A', 'Al-Wathba', '2026-06-01', '1998-03-14', 'male', 'active', null),
    ('SYR-PLR-0102', 'Demo Syrian Player B', 'Al-Shorta Damascus', '2025-09-15', '1995-08-22', 'male', 'active', null),
    ('SYR-PLR-0103', 'Demo Syrian Player C', 'Hama FC', '2024-01-10', '1992-11-02', 'male', 'retired', null),
    ('SYR-PLR-0104', 'Demo Syrian Player D', 'Al-Wathba', '2023-07-20', '2001-01-30', 'male', 'free', null),
    ('SYR-PLR-0105', 'Demo Syrian Player E', 'Tishreen', '2022-04-05', '1988-12-10', 'male', 'deceased', '2024-06-18'),
    ('SYR-PLR-0106', 'Demo Syrian Player F', 'Al-Ittihad Ahli Aleppo', '2026-02-01', '2003-05-17', 'male', 'active', null)
) as p(player_code, full_name, club_name, enrollment_date, birth_date, gender, status, death_date)
join public.sports s on s.name = 'Football'
join public.clubs c on c.name = p.club_name
on conflict (player_code) do update
set
  full_name = excluded.full_name,
  sport_id = excluded.sport_id,
  current_club_id = excluded.current_club_id,
  enrollment_date = excluded.enrollment_date,
  birth_date = excluded.birth_date,
  nationality = excluded.nationality,
  gender = excluded.gender,
  status = excluded.status,
  death_date = excluded.death_date,
  photo_url = excluded.photo_url;

-- 4) Ensure active contracts for active demo players if missing
with creator as (
  select id from public.users order by created_at asc limit 1
),
active_demo as (
  select p.id as player_id, p.current_club_id as club_id
  from public.players p
  where p.player_code in ('SYR-PLR-0101', 'SYR-PLR-0102', 'SYR-PLR-0106')
)
insert into public.contracts (
  player_id,
  club_id,
  start_date,
  end_date,
  status,
  notes,
  created_by
)
select
  d.player_id,
  d.club_id,
  date '2026-06-01',
  date '2027-05-31',
  'active',
  'Extended demo active contract',
  (select id from creator)
from active_demo d
where not exists (
  select 1
  from public.contracts c
  where c.player_id = d.player_id and c.status = 'active'
);

-- 5) Add historical contracts and club history for non-active examples
with creator as (
  select id from public.users order by created_at asc limit 1
),
retired_player as (
  select p.id as player_id, c.id as old_club_id
  from public.players p
  join public.clubs c on c.name = 'Al-Shorta Damascus'
  where p.player_code = 'SYR-PLR-0103'
),
free_player as (
  select p.id as player_id, c.id as old_club_id
  from public.players p
  join public.clubs c on c.name = 'Al-Wathba'
  where p.player_code = 'SYR-PLR-0104'
),
deceased_player as (
  select p.id as player_id, c.id as old_club_id
  from public.players p
  join public.clubs c on c.name = 'Tishreen'
  where p.player_code = 'SYR-PLR-0105'
)
insert into public.contracts (
  player_id,
  club_id,
  start_date,
  end_date,
  status,
  termination_reason,
  notes,
  created_by
)
select
  rp.player_id,
  rp.old_club_id,
  date '2022-01-01',
  date '2024-12-31',
  'terminated',
  'Retirement',
  'Ended due to retirement (demo)',
  (select id from creator)
from retired_player rp
where not exists (
  select 1 from public.contracts c
  where c.player_id = rp.player_id and c.status = 'terminated'
)
union all
select
  fp.player_id,
  fp.old_club_id,
  date '2021-07-01',
  date '2024-03-31',
  'expired',
  'Contract expired',
  'Player became free agent (demo)',
  (select id from creator)
from free_player fp
where not exists (
  select 1 from public.contracts c
  where c.player_id = fp.player_id and c.status = 'expired'
)
union all
select
  dp.player_id,
  dp.old_club_id,
  date '2020-08-01',
  date '2024-06-18',
  'terminated',
  'Deceased',
  'Contract closed due to death (demo)',
  (select id from creator)
from deceased_player dp
where not exists (
  select 1 from public.contracts c
  where c.player_id = dp.player_id and c.termination_reason = 'Deceased'
);

-- 6) Add player_club_history rows (if missing)
insert into public.player_club_history (player_id, club_id, start_date, end_date, reason)
select p.id, c.id, date '2022-01-01', date '2024-12-31', 'Retired'
from public.players p
join public.clubs c on c.name = 'Al-Shorta Damascus'
where p.player_code = 'SYR-PLR-0103'
and not exists (
  select 1 from public.player_club_history h
  where h.player_id = p.id and h.reason = 'Retired'
)
union all
select p.id, c.id, date '2021-07-01', date '2024-03-31', 'Free agent'
from public.players p
join public.clubs c on c.name = 'Al-Wathba'
where p.player_code = 'SYR-PLR-0104'
and not exists (
  select 1 from public.player_club_history h
  where h.player_id = p.id and h.reason = 'Free agent'
)
union all
select p.id, c.id, date '2020-08-01', date '2024-06-18', 'Deceased'
from public.players p
join public.clubs c on c.name = 'Tishreen'
where p.player_code = 'SYR-PLR-0105'
and not exists (
  select 1 from public.player_club_history h
  where h.player_id = p.id and h.reason = 'Deceased'
);

-- 7) Add status_changes rows (audit examples)
with actor as (
  select id from public.users order by created_at asc limit 1
)
insert into public.status_changes (player_id, old_status, new_status, reason, changed_by)
select p.id, 'active', 'retired', 'Retired from professional football (demo)', (select id from actor)
from public.players p
where p.player_code = 'SYR-PLR-0103'
and exists (select 1 from actor)
and not exists (
  select 1 from public.status_changes s
  where s.player_id = p.id and s.new_status = 'retired'
)
union all
select p.id, 'active', 'free', 'Contract ended and no new club (demo)', (select id from actor)
from public.players p
where p.player_code = 'SYR-PLR-0104'
and exists (select 1 from actor)
and not exists (
  select 1 from public.status_changes s
  where s.player_id = p.id and s.new_status = 'free'
)
union all
select p.id, 'active', 'deceased', 'Marked deceased (demo)', (select id from actor)
from public.players p
where p.player_code = 'SYR-PLR-0105'
and exists (select 1 from actor)
and not exists (
  select 1 from public.status_changes s
  where s.player_id = p.id and s.new_status = 'deceased'
);

-- 8) Add achievements demo rows
insert into public.achievements (player_id, title, event_date, place, rank, image_url)
select p.id, 'Syrian Cup Finalist', date '2025-05-18', 'Damascus', 'Runner-up', null
from public.players p
where p.player_code = 'SYR-PLR-0101'
and not exists (
  select 1 from public.achievements a
  where a.player_id = p.id and a.title = 'Syrian Cup Finalist'
)
union all
select p.id, 'League Top Scorer Nominee', date '2024-06-01', 'Latakia', 'Top 5', null
from public.players p
where p.player_code = 'SYR-PLR-0102'
and not exists (
  select 1 from public.achievements a
  where a.player_id = p.id and a.title = 'League Top Scorer Nominee'
)
union all
select p.id, 'Best Young Player Shortlist', date '2026-04-20', 'Aleppo', 'Shortlisted', null
from public.players p
where p.player_code = 'SYR-PLR-0106'
and not exists (
  select 1 from public.achievements a
  where a.player_id = p.id and a.title = 'Best Young Player Shortlist'
);

-- 9) Add documents demo rows (requires at least one user)
with actor as (
  select id from public.users order by created_at asc limit 1
)
insert into public.documents (player_id, doc_type, file_url, uploaded_by)
select p.id, 'contract', 'https://example.com/docs/syr-plr-0101-contract.pdf', (select id from actor)
from public.players p
where p.player_code = 'SYR-PLR-0101'
and exists (select 1 from actor)
and not exists (
  select 1 from public.documents d
  where d.player_id = p.id and d.file_url = 'https://example.com/docs/syr-plr-0101-contract.pdf'
)
union all
select p.id, 'id', 'https://example.com/docs/syr-plr-0102-id.pdf', (select id from actor)
from public.players p
where p.player_code = 'SYR-PLR-0102'
and exists (select 1 from actor)
and not exists (
  select 1 from public.documents d
  where d.player_id = p.id and d.file_url = 'https://example.com/docs/syr-plr-0102-id.pdf'
);

-- 10) Optional favorites for first user (if present)
with first_user as (
  select id from public.users order by created_at asc limit 1
),
fav_player as (
  select p.id as player_id from public.players p where p.player_code = 'SYR-PLR-0001'
),
fav_club as (
  select c.id as club_id from public.clubs c where c.name = 'Al-Karamah'
)
insert into public.favorites (user_id, player_id, club_id)
select fu.id, fp.player_id, null
from first_user fu
cross join fav_player fp
where not exists (
  select 1 from public.favorites f
  where f.user_id = fu.id and f.player_id = fp.player_id
)
union all
select fu.id, null, fc.club_id
from first_user fu
cross join fav_club fc
where not exists (
  select 1 from public.favorites f
  where f.user_id = fu.id and f.club_id = fc.club_id
);

commit;
