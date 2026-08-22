-- Reset seeded demo data (safe scope)
-- This script removes demo rows created by:
-- - 003_seed_syrian_mock_data.sql
-- - 004_seed_syrian_extended_demo.sql
--
-- It only targets known demo player codes and known demo club names.
-- It does NOT delete auth users.

begin;

-- Target demo players by code prefix.
with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
),
demo_clubs as (
  select id, name
  from public.clubs
  where name in (
    'Al-Ittihad Ahli Aleppo',
    'Al-Jaish',
    'Al-Karamah',
    'Tishreen',
    'Al-Wahda Damascus',
    'Al-Fotuwa',
    'Hutteen',
    'Jableh',
    'Al-Wathba',
    'Al-Shorta Damascus',
    'Hama FC'
  )
)
-- Favorites referencing demo players/clubs
delete from public.favorites
where player_id in (select id from demo_players)
   or club_id in (select id from demo_clubs);

-- Player-related child tables
with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
delete from public.documents
where player_id in (select id from demo_players);

with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
delete from public.achievements
where player_id in (select id from demo_players);

with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
delete from public.status_changes
where player_id in (select id from demo_players);

with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
delete from public.player_club_history
where player_id in (select id from demo_players);

with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
delete from public.contracts
where player_id in (select id from demo_players);

-- If any user profiles were linked to demo players, unlink them first.
with demo_players as (
  select id
  from public.players
  where player_code like 'SYR-PLR-%'
)
update public.users
set player_id = null
where player_id in (select id from demo_players);

-- Remove demo players
delete from public.players
where player_code like 'SYR-PLR-%';

-- Remove club_sports for demo clubs
with demo_clubs as (
  select id
  from public.clubs
  where name in (
    'Al-Ittihad Ahli Aleppo',
    'Al-Jaish',
    'Al-Karamah',
    'Tishreen',
    'Al-Wahda Damascus',
    'Al-Fotuwa',
    'Hutteen',
    'Jableh',
    'Al-Wathba',
    'Al-Shorta Damascus',
    'Hama FC'
  )
)
delete from public.club_sports
where club_id in (select id from demo_clubs);

-- Delete demo clubs only when not referenced by users.
delete from public.clubs c
where c.name in (
  'Al-Ittihad Ahli Aleppo',
  'Al-Jaish',
  'Al-Karamah',
  'Tishreen',
  'Al-Wahda Damascus',
  'Al-Fotuwa',
  'Hutteen',
  'Jableh',
  'Al-Wathba',
  'Al-Shorta Damascus',
  'Hama FC'
)
and not exists (
  select 1 from public.users u where u.club_id = c.id
);

-- Keep sports by default (Football/Basketball/Volleyball) to avoid impacting real data.
-- If needed, remove them manually after checking no dependencies.

commit;
