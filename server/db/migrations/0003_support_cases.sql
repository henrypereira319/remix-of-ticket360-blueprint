do $$
begin
  if not exists (select 1 from pg_type where typname = 'support_case_status') then
    create type public.support_case_status as enum ('open', 'investigating', 'resolved');
  end if;

  if not exists (select 1 from pg_type where typname = 'support_case_category') then
    create type public.support_case_category as enum ('order', 'payment', 'ticket', 'refund', 'access');
  end if;
end $$;

create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  category public.support_case_category not null,
  status public.support_case_status not null default 'open',
  subject text not null,
  message text not null,
  resolution_summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists support_cases_account_created_idx
  on public.support_cases (account_id, created_at desc);

create index if not exists support_cases_order_created_idx
  on public.support_cases (order_id, created_at desc);

create index if not exists support_cases_status_created_idx
  on public.support_cases (status, created_at desc);

alter table public.support_cases enable row level security;

drop policy if exists support_cases_select_own on public.support_cases;
create policy support_cases_select_own
  on public.support_cases for select
  using (auth.uid() = account_id);

drop policy if exists support_cases_insert_own on public.support_cases;
create policy support_cases_insert_own
  on public.support_cases for insert
  with check (auth.uid() = account_id);

drop trigger if exists set_updated_at_support_cases on public.support_cases;
create trigger set_updated_at_support_cases
  before update on public.support_cases
  for each row execute procedure public.set_updated_at();
