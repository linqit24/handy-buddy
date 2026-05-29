-- ============================================================
-- handy-buddy: multi-tenant foundation
-- Run this in Supabase SQL editor ONCE before running seed.ts
-- ============================================================

-- One row per property management company
create table if not exists companies (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,        -- url-safe key: 'castle', 'baysidepm'
  name          text not null,               -- 'Castle Companies'
  logo_url      text,
  primary_color text default '#2563eb',
  created_at    timestamptz default now()
);

-- Zone schedules per company (replaces hardcoded PROP_ZONE map in code)
create table if not exists company_zones (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies(id) on delete cascade,
  zone_number  int  not null,
  label        text not null,               -- 'Zone 1'
  days         int[] not null,              -- [1,5] = Mon, Fri
  day_label    text not null,               -- 'Mon & Fri'
  area_name    text not null                -- 'West Bay'
);

-- Seed Castle Companies
insert into companies (slug, name, primary_color)
values ('castle', 'Castle Companies', '#1e3a5f')
on conflict (slug) do nothing;

-- Seed Castle zones
with co as (select id from companies where slug = 'castle')
insert into company_zones (company_id, zone_number, label, days, day_label, area_name)
select
  co.id, z.zone_number, z.label, z.days, z.day_label, z.area_name
from co, (values
  (1, 'Zone 1', array[1,5], 'Mon & Fri',  'West Bay'),
  (2, 'Zone 2', array[2,4], 'Tue & Thu',  'Central CCC'),
  (3, 'Zone 3', array[3,6], 'Wed & Sat',  'South & East')
) as z(zone_number, label, days, day_label, area_name)
on conflict do nothing;

-- Add company_id to existing tables
alter table pm_profiles
  add column if not exists company_id uuid references companies(id),
  add column if not exists role text default 'resident_manager';

alter table pm_properties
  add column if not exists company_id uuid references companies(id),
  add column if not exists zone_number int;

-- Backfill existing Castle rows (run after seed.ts)
-- update pm_profiles   set company_id = (select id from companies where slug='castle') where company_id is null;
-- update pm_properties set company_id = (select id from companies where slug='castle') where company_id is null;

-- Slot bookings table (replaces localStorage in production)
create table if not exists slot_bookings (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id),
  slot_date   date not null,
  slot_period text not null check (slot_period in ('am','pm')),
  booked_count int default 1,
  unique (company_id, slot_date, slot_period)
);

-- RLS: users only see their own company's data
alter table companies      enable row level security;
alter table company_zones  enable row level security;
alter table slot_bookings  enable row level security;

create policy "users see own company zones" on company_zones
  for select using (
    company_id = (select company_id from pm_profiles where id = auth.uid())
  );

create policy "users see own company slots" on slot_bookings
  for select using (
    company_id = (select company_id from pm_profiles where id = auth.uid())
  );

create policy "users update own company slots" on slot_bookings
  for insert with check (
    company_id = (select company_id from pm_profiles where id = auth.uid())
  );
