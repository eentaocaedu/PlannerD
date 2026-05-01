-- Extension for UUID generation
create extension if not exists pgcrypto;

-- 1. profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  company_name text,
  email text,
  phone text,
  instagram text,
  notes text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null check (year >= 2024 and year <= 2100),
  status text not null default 'draft',
  public_token text unique,
  import_source_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sent_at timestamptz,
  approved_at timestamptz,
  unique (client_id, month, year)
);

-- 4. plan_items
create table if not exists plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  date date,
  time time,
  channel text,
  format text,
  title text,
  caption text,
  creative_direction text,
  reference_url text,
  internal_notes text,
  status text not null default 'draft',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. plan_comments
create table if not exists plan_comments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  plan_item_id uuid references plan_items(id) on delete cascade,
  author_type text not null check (author_type in ('owner', 'client')),
  author_name text,
  comment text not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- 6. approval_events
create table if not exists approval_events (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  event_type text not null,
  message text,
  created_at timestamptz default now()
);

-- RLS: Enable
alter table clients enable row level security;
alter table plans enable row level security;
alter table plan_items enable row level security;
alter table plan_comments enable row level security;
alter table approval_events enable row level security;

-- Policies
create policy "owner can manage own clients"
on clients
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owner can manage own plans"
on plans
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owner can manage own plan items"
on plan_items
for all
using (
  exists (
    select 1 from plans
    where plans.id = plan_items.plan_id
    and plans.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = plan_items.plan_id
    and plans.owner_id = auth.uid()
  )
);

create policy "owner can manage own comments"
on plan_comments
for all
using (
  exists (
    select 1 from plans
    where plans.id = plan_comments.plan_id
    and plans.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = plan_comments.plan_id
    and plans.owner_id = auth.uid()
  )
);

create policy "owner can manage own approval events"
on approval_events
for all
using (
  exists (
    select 1 from plans
    where plans.id = approval_events.plan_id
    and plans.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from plans
    where plans.id = approval_events.plan_id
    and plans.owner_id = auth.uid()
  )
);
