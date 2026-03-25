create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  document text,
  phone text,
  city text,
  provider public.account_provider not null default 'password',
  password_salt text,
  password_hash text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.customer_account_activity_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts (id) on delete cascade,
  activity_type public.account_activity_type not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists customer_accounts_email_idx
  on public.customer_accounts (email);

create index if not exists customer_account_activity_account_created_idx
  on public.customer_account_activity_log (account_id, created_at desc);

drop trigger if exists set_updated_at_customer_accounts on public.customer_accounts;
create trigger set_updated_at_customer_accounts
  before update on public.customer_accounts
  for each row execute procedure public.set_updated_at();
