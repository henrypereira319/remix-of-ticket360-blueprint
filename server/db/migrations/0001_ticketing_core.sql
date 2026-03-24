create schema if not exists app_private;

create table if not exists app_private.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_provider') then
    create type public.account_provider as enum ('password', 'google');
  end if;

  if not exists (select 1 from pg_type where typname = 'account_activity_type') then
    create type public.account_activity_type as enum ('registered', 'login', 'profile_updated', 'logout');
  end if;

  if not exists (select 1 from pg_type where typname = 'venue_kind') then
    create type public.venue_kind as enum ('seated', 'festival', 'hybrid');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('draft', 'published', 'cancelled', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'session_status') then
    create type public.session_status as enum ('scheduled', 'onsale', 'sold_out', 'cancelled', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'seat_status') then
    create type public.seat_status as enum ('available', 'reserved', 'sold', 'blocked', 'accessible');
  end if;

  if not exists (select 1 from pg_type where typname = 'seat_hold_status') then
    create type public.seat_hold_status as enum ('active', 'expired', 'confirmed', 'released');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('pix', 'card', 'corporate');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('submitted', 'under_review', 'approved', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_category') then
    create type public.ticket_category as enum ('full', 'half', 'social');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('authorized', 'under_review', 'failed', 'expired', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_provider') then
    create type public.payment_provider as enum ('local-pix', 'local-card', 'manual-corporate', 'provider-pix', 'provider-card');
  end if;

  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type public.ticket_status as enum ('issued', 'used', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type public.notification_channel as enum ('email', 'sms', 'push', 'whatsapp');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_template') then
    create type public.notification_template as enum ('order-confirmation', 'tickets-issued', 'payment-under-review', 'order-cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'notification_status') then
    create type public.notification_status as enum ('queued', 'sent', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'analytics_event_name') then
    create type public.analytics_event_name as enum (
      'seat_hold_created',
      'seat_hold_released',
      'payment_authorized',
      'payment_under_review',
      'order_approved',
      'order_cancelled',
      'tickets_issued',
      'tickets_cancelled',
      'notifications_dispatched'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'operator_role') then
    create type public.operator_role as enum ('customer', 'support', 'operations', 'producer', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_actor_type') then
    create type public.audit_actor_type as enum ('system', 'account', 'operator');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  document text,
  phone text,
  city text,
  provider public.account_provider not null default 'password',
  role public.operator_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.account_activity_log (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  activity_type public.account_activity_type not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null,
  state text,
  country text not null default 'BR',
  address text,
  timezone text not null default 'America/Sao_Paulo',
  kind public.venue_kind not null default 'seated',
  seat_map_manifest jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  description text,
  category text not null,
  city text not null,
  venue_id uuid references public.venues (id) on delete set null,
  banner_url text,
  hero_url text,
  price_from numeric(12,2) not null default 0,
  service_fee_per_ticket numeric(12,2) not null default 18,
  processing_fee_per_order numeric(12,2) not null default 4.9,
  platform_fee_rate numeric(8,4) not null default 0.10,
  currency text not null default 'BRL',
  status public.event_status not null default 'draft',
  published_at timestamptz,
  security_notes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  starts_at timestamptz not null,
  doors_open_at timestamptz,
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  status public.session_status not null default 'scheduled',
  capacity integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists event_sessions_event_id_starts_at_idx
  on public.event_sessions (event_id, starts_at);

create table if not exists public.event_sections (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions (id) on delete cascade,
  section_key text not null,
  name text not null,
  short_label text,
  price numeric(12,2) not null,
  position integer not null default 0,
  tone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (session_id, section_key)
);

create table if not exists public.event_seats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions (id) on delete cascade,
  section_id uuid references public.event_sections (id) on delete set null,
  seat_key text not null,
  label text not null,
  row_label text,
  seat_number integer,
  area_label text,
  base_price numeric(12,2) not null,
  status public.seat_status not null default 'available',
  tags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (session_id, seat_key)
);

create index if not exists event_seats_session_status_idx
  on public.event_seats (session_id, status);

create table if not exists public.seat_holds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions (id) on delete cascade,
  seat_id uuid not null references public.event_seats (id) on delete cascade,
  hold_token text not null unique,
  account_id uuid references public.profiles (id) on delete set null,
  status public.seat_hold_status not null default 'active',
  source text not null default 'checkout',
  expires_at timestamptz not null,
  order_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists seat_holds_active_seat_idx
  on public.seat_holds (seat_id)
  where status = 'active';

create index if not exists seat_holds_token_status_idx
  on public.seat_holds (hold_token, status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  event_id uuid not null references public.events (id) on delete restrict,
  session_id uuid references public.event_sessions (id) on delete set null,
  account_id uuid references public.profiles (id) on delete set null,
  status public.order_status not null default 'submitted',
  payment_method public.payment_method not null,
  installments text not null default '1x',
  buyer_full_name text not null,
  buyer_email text not null,
  buyer_document text,
  buyer_phone text,
  buyer_city text,
  subtotal numeric(12,2) not null default 0,
  service_fee numeric(12,2) not null default 0,
  processing_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  platform_fee_rate numeric(8,4) not null default 0.10,
  platform_fee_total numeric(12,2) not null default 0,
  currency text not null default 'BRL',
  hold_token text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists orders_account_created_idx
  on public.orders (account_id, created_at desc);

create index if not exists orders_event_status_idx
  on public.orders (event_id, status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'seat_holds'
      and constraint_name = 'seat_holds_order_id_fkey'
  ) then
    alter table public.seat_holds
      add constraint seat_holds_order_id_fkey
      foreign key (order_id) references public.orders (id) on delete set null;
  end if;
end $$;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  seat_id uuid references public.event_seats (id) on delete set null,
  section_id uuid references public.event_sections (id) on delete set null,
  hold_id uuid references public.seat_holds (id) on delete set null,
  seat_key text not null,
  label text not null,
  row_label text,
  section_key text,
  section_name text not null,
  holder_name text not null,
  holder_document text,
  ticket_category public.ticket_category not null,
  base_price numeric(12,2) not null,
  price numeric(12,2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists order_items_order_idx
  on public.order_items (order_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  reference text not null unique,
  provider public.payment_provider not null,
  method public.payment_method not null,
  status public.payment_status not null,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  installments text not null default '1x',
  pix_payload text,
  pix_copy_paste text,
  pix_expires_at timestamptz,
  masked_card text,
  corporate_protocol text,
  authorized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists payments_status_created_idx
  on public.payments (status, created_at desc);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete set null,
  account_id uuid references public.profiles (id) on delete set null,
  event_id uuid not null references public.events (id) on delete restrict,
  session_id uuid references public.event_sessions (id) on delete set null,
  seat_id uuid references public.event_seats (id) on delete set null,
  holder_name text not null,
  holder_document text,
  label text not null,
  section_name text not null,
  barcode text not null unique,
  qr_payload text not null,
  wallet_token text not null unique,
  wallet_url text not null,
  status public.ticket_status not null default 'issued',
  issued_at timestamptz not null default timezone('utc'::text, now()),
  used_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists tickets_account_status_idx
  on public.tickets (account_id, status, issued_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete cascade,
  account_id uuid references public.profiles (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  channel public.notification_channel not null default 'email',
  template public.notification_template not null,
  recipient text not null,
  subject text not null,
  preview text not null,
  status public.notification_status not null default 'queued',
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notifications_order_created_idx
  on public.notifications (order_id, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  name public.analytics_event_name not null,
  account_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  session_id uuid references public.event_sessions (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists analytics_events_name_occurred_idx
  on public.analytics_events (name, occurred_at desc);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_type public.audit_actor_type not null,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_table text not null,
  target_id uuid,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google' then 'google'::public.account_provider
      else 'password'::public.account_provider
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    provider = excluded.provider,
    updated_at = timezone('utc'::text, now());

  insert into public.account_activity_log (profile_id, activity_type, message, metadata)
  values (
    new.id,
    'registered'::public.account_activity_type,
    'Conta criada via Supabase Auth.',
    jsonb_build_object('provider', coalesce(new.raw_app_meta_data ->> 'provider', 'email'))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_profile();

alter table public.profiles enable row level security;
alter table public.account_activity_log enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.seat_holds enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists account_activity_select_self on public.account_activity_log;
create policy account_activity_select_self
  on public.account_activity_log for select
  using (auth.uid() = profile_id);

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
  on public.orders for select
  using (auth.uid() = account_id);

drop policy if exists order_items_select_by_order_owner on public.order_items;
create policy order_items_select_by_order_owner
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders
      where public.orders.id = order_id
        and public.orders.account_id = auth.uid()
    )
  );

drop policy if exists payments_select_by_order_owner on public.payments;
create policy payments_select_by_order_owner
  on public.payments for select
  using (
    exists (
      select 1
      from public.orders
      where public.orders.id = order_id
        and public.orders.account_id = auth.uid()
    )
  );

drop policy if exists tickets_select_own on public.tickets;
create policy tickets_select_own
  on public.tickets for select
  using (auth.uid() = account_id);

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications for select
  using (auth.uid() = account_id);

drop policy if exists seat_holds_select_own on public.seat_holds;
create policy seat_holds_select_own
  on public.seat_holds for select
  using (auth.uid() = account_id);

drop policy if exists analytics_events_select_own on public.analytics_events;
create policy analytics_events_select_own
  on public.analytics_events for select
  using (auth.uid() = account_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'venues',
    'events',
    'event_sessions',
    'event_sections',
    'event_seats',
    'seat_holds',
    'orders',
    'order_items',
    'payments',
    'tickets',
    'notifications',
    'analytics_events'
  ]
  loop
    execute format('drop trigger if exists set_updated_at_%1$s on public.%1$s', table_name);
    execute format(
      'create trigger set_updated_at_%1$s before update on public.%1$s for each row execute procedure public.set_updated_at()',
      table_name
    );
  end loop;
end $$;
