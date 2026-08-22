-- Phase: Mock data (Syria-focused)
-- This script seeds sports, clubs, players, club_sports, and sample active contracts.
-- Sources used during research:
-- - https://en.wikipedia.org/wiki/Syrian_Premier_League
-- - https://en.wikipedia.org/wiki/Al-Ittihad_SC_Aleppo
-- - https://en.wikipedia.org/wiki/Al-Jaish_SC_(Syria)
-- - https://en.wikipedia.org/wiki/Al-Karamah_SC
-- - https://en.wikipedia.org/wiki/Tishreen_SC
-- - https://en.wikipedia.org/wiki/Al-Wahda_SC_(Syria)
-- - https://en.wikipedia.org/wiki/Al-Fotuwa_SC
-- - https://en.wikipedia.org/wiki/Omar_Al_Somah
-- - https://en.wikipedia.org/wiki/Omar_Khribin
-- - https://en.wikipedia.org/wiki/Mahmoud_Al-Mawas
-- - https://en.wikipedia.org/wiki/Ibrahim_Alma
-- - https://en.wikipedia.org/wiki/Khaled_Kurdaghli
-- - https://www.the-afc.com/en/west/syria.html
--
-- Notes:
-- - This is mock data for hackathon demos, not an official or current federation roster.
-- - Some birth dates are approximate to year-level where public summary exposed year only.

begin;

-- 1) sports
insert into public.sports (name, icon_url)
values
  ('Football', null),
  ('Basketball', null),
  ('Volleyball', null)
on conflict (name) do update
set icon_url = excluded.icon_url;

-- 2) clubs (Syrian examples)
insert into public.clubs (name, logo_url, city, status)
values
  ('Al-Ittihad Ahli Aleppo', null, 'Aleppo', 'active'),
  ('Al-Jaish', null, 'Damascus', 'active'),
  ('Al-Karamah', null, 'Homs', 'active'),
  ('Tishreen', null, 'Latakia', 'active'),
  ('Al-Wahda Damascus', null, 'Damascus', 'active'),
  ('Al-Fotuwa', null, 'Deir ez-Zor', 'active'),
  ('Hutteen', null, 'Latakia', 'active'),
  ('Jableh', null, 'Jableh', 'active')
on conflict (name) do update
set
  city = excluded.city,
  status = excluded.status;

-- 3) club_sports relations
with football as (
  select id from public.sports where name = 'Football'
),
basketball as (
  select id from public.sports where name = 'Basketball'
),
clubs_for_football as (
  select id as club_id
  from public.clubs
  where name in (
    'Al-Ittihad Ahli Aleppo',
    'Al-Jaish',
    'Al-Karamah',
    'Tishreen',
    'Al-Wahda Damascus',
    'Al-Fotuwa',
    'Hutteen',
    'Jableh'
  )
),
clubs_for_basketball as (
  select id as club_id
  from public.clubs
  where name in ('Al-Ittihad Ahli Aleppo', 'Al-Jaish', 'Al-Wahda Damascus')
)
insert into public.club_sports (club_id, sport_id)
select c.club_id, f.id
from clubs_for_football c
cross join football f
on conflict do nothing;

with basketball as (
  select id from public.sports where name = 'Basketball'
),
clubs_for_basketball as (
  select id as club_id
  from public.clubs
  where name in ('Al-Ittihad Ahli Aleppo', 'Al-Jaish', 'Al-Wahda Damascus')
)
insert into public.club_sports (club_id, sport_id)
select c.club_id, b.id
from clubs_for_basketball c
cross join basketball b
on conflict do nothing;

-- 4) players (Syria-focused sample)
-- player_code values are demo IDs for this system.
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
  s.id as sport_id,
  c.id as current_club_id,
  p.enrollment_date::date,
  p.birth_date::date,
  'Syrian' as nationality,
  'male' as gender,
  'active' as status,
  null as death_date,
  null as photo_url
from (
  values
    ('SYR-PLR-0001', 'Omar Al Somah', 'Al-Fotuwa', '2026-07-01', '1989-03-23'),
    ('SYR-PLR-0002', 'Omar Khribin', 'Al-Wahda Damascus', '2026-07-01', '1994-01-15'),
    ('SYR-PLR-0003', 'Mahmoud Al-Mawas', 'Al-Karamah', '2026-07-01', '1993-01-01'),
    ('SYR-PLR-0004', 'Ibrahim Alma', 'Tishreen', '2026-07-01', '1991-01-01'),
    ('SYR-PLR-0005', 'Khaled Kourdoghli', 'Tishreen', '2026-07-01', '1997-01-31'),
    ('SYR-PLR-0006', 'Firas Al-Khatib', 'Al-Karamah', '2026-07-01', '1983-06-09'),
    ('SYR-PLR-0007', 'Aiham Ousou', 'Al-Ittihad Ahli Aleppo', '2026-07-01', '2000-01-09'),
    ('SYR-PLR-0008', 'Moayad Ajan', 'Al-Jaish', '2026-07-01', '1993-01-01')
) as p(player_code, full_name, club_name, enrollment_date, birth_date)
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

-- 5) sample contracts for seeded players
-- Uses the first user (if any) as created_by; otherwise null.
with creator as (
  select id from public.users order by created_at asc limit 1
),
seeded as (
  select p.id as player_id, p.current_club_id as club_id
  from public.players p
  where p.player_code like 'SYR-PLR-%'
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
  s.player_id,
  s.club_id,
  date '2026-07-01',
  date '2027-06-30',
  'active',
  null,
  'Seeded Syrian mock contract',
  (select id from creator)
from seeded s
where not exists (
  select 1
  from public.contracts c
  where c.player_id = s.player_id and c.status = 'active'
);

commit;
