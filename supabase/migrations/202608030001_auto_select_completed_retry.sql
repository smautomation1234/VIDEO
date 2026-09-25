-- Automatically promote a successful retry when the previously selected take
-- failed or has no stored media. This keeps clip selection and timeline rows in
-- sync even if an older application deployment completes the generation.

create or replace function public.activate_completed_retry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'completed'
    and new.storage_path is not null
    and (
      old.status is distinct from new.status
      or old.storage_path is distinct from new.storage_path
    )
  then
    perform pg_advisory_xact_lock(hashtextextended(new.clip_id::text, 0));

    if not exists (
      select 1
      from public.clip_takes as playable
      where playable.clip_id = new.clip_id
        and playable.id <> new.id
        and playable.selected
        and playable.status = 'completed'
        and playable.storage_path is not null
    ) then
      update public.clip_takes as other_take
      set selected = false
      where other_take.clip_id = new.clip_id
        and other_take.id <> new.id
        and other_take.selected;

      new.selected := true;

      update public.timeline_items as timeline_item
      set take_id = new.id
      where timeline_item.clip_id = new.clip_id
        and (
          timeline_item.take_id is null
          or exists (
            select 1
            from public.clip_takes as referenced_take
            where referenced_take.id = timeline_item.take_id
              and (
                referenced_take.status <> 'completed'
                or referenced_take.storage_path is null
              )
          )
        );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists activate_completed_retry on public.clip_takes;
create trigger activate_completed_retry
  before update of status, storage_path on public.clip_takes
  for each row execute function public.activate_completed_retry();

-- Repair existing clips that are already in the failed-first/successful-retry
-- state. The newest completed stored take becomes active only when there is no
-- playable selected take.
do $$
declare
  candidate record;
begin
  for candidate in
    select distinct on (completed_take.clip_id)
      completed_take.clip_id,
      completed_take.id as take_id
    from public.clip_takes as completed_take
    where completed_take.status = 'completed'
      and completed_take.storage_path is not null
      and not exists (
        select 1
        from public.clip_takes as selected_take
        where selected_take.clip_id = completed_take.clip_id
          and selected_take.selected
          and selected_take.status = 'completed'
          and selected_take.storage_path is not null
      )
    order by completed_take.clip_id, completed_take.take_number desc
  loop
    update public.clip_takes
    set selected = (id = candidate.take_id)
    where clip_id = candidate.clip_id;

    update public.timeline_items as timeline_item
    set take_id = candidate.take_id
    where timeline_item.clip_id = candidate.clip_id
      and (
        timeline_item.take_id is null
        or exists (
          select 1
          from public.clip_takes as referenced_take
          where referenced_take.id = timeline_item.take_id
            and (
              referenced_take.status <> 'completed'
              or referenced_take.storage_path is null
            )
        )
      );
  end loop;
end;
$$;

revoke all on function public.activate_completed_retry() from public, anon, authenticated;
grant execute on function public.activate_completed_retry() to service_role;
