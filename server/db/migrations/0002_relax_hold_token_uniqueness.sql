do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'seat_holds'
      and constraint_name = 'seat_holds_hold_token_key'
  ) then
    alter table public.seat_holds
      drop constraint seat_holds_hold_token_key;
  end if;
end $$;

create unique index if not exists seat_holds_hold_token_seat_idx
  on public.seat_holds (hold_token, seat_id);
