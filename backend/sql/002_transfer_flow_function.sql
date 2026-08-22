-- Phase 5: atomic transfer flow
-- Run in Supabase SQL editor after 001_mvp_schema.sql

create or replace function public.execute_player_transfer(
  p_player_id uuid,
  p_to_club_id uuid,
  p_new_start_date date,
  p_new_end_date date,
  p_termination_reason text,
  p_transition_notes text,
  p_enrollment_date date,
  p_changed_by uuid
)
returns table(
  old_contract_id uuid,
  new_contract_id uuid,
  player_id uuid,
  from_club_id uuid,
  to_club_id uuid
)
language plpgsql
security definer
as $$
declare
  v_player players%rowtype;
  v_old_contract contracts%rowtype;
  v_new_contract_id uuid;
  v_enrollment_date date;
begin
  if p_new_end_date < p_new_start_date then
    raise exception 'new end date must be greater than or equal to new start date';
  end if;

  select *
  into v_player
  from public.players
  where id = p_player_id
  for update;

  if not found then
    raise exception 'player not found';
  end if;

  select c.*
  into v_old_contract
  from public.contracts c
  where c.player_id = p_player_id
    and c.status = 'active'
  order by c.created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'active contract not found for player';
  end if;

  if v_old_contract.club_id = p_to_club_id then
    raise exception 'destination club must be different from current club';
  end if;

  v_enrollment_date := coalesce(p_enrollment_date, p_new_start_date);

  update public.contracts
  set
    status = 'transferred',
    termination_reason = p_termination_reason,
    notes = coalesce(p_transition_notes, notes)
  where id = v_old_contract.id;

  update public.players
  set
    current_club_id = p_to_club_id,
    enrollment_date = v_enrollment_date
  where id = p_player_id;

  insert into public.contracts (
    player_id,
    club_id,
    start_date,
    end_date,
    status,
    notes,
    created_by
  )
  values (
    p_player_id,
    p_to_club_id,
    p_new_start_date,
    p_new_end_date,
    'active',
    p_transition_notes,
    p_changed_by
  )
  returning id into v_new_contract_id;

  insert into public.player_club_history (
    player_id,
    club_id,
    start_date,
    end_date,
    reason
  )
  values (
    p_player_id,
    v_old_contract.club_id,
    v_old_contract.start_date,
    p_new_start_date,
    p_termination_reason
  );

  insert into public.status_changes (
    player_id,
    old_status,
    new_status,
    reason,
    changed_by
  )
  values (
    p_player_id,
    v_player.status,
    v_player.status,
    concat('transfer: ', p_termination_reason),
    p_changed_by
  );

  return query
  select
    v_old_contract.id,
    v_new_contract_id,
    p_player_id,
    v_old_contract.club_id,
    p_to_club_id;
end;
$$;
