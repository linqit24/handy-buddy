
-- pm_profiles: stores per-user profile data
create table if not exists pm_profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  contact_name        text,
  phone               text,
  role                text default 'resident_manager',
  company_id          uuid,
  onboarding_completed boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table pm_profiles enable row level security;

create policy "users_select_own_profile" on pm_profiles for select
  to authenticated using (auth.uid() = id);
create policy "users_insert_own_profile" on pm_profiles for insert
  to authenticated with check (auth.uid() = id);
create policy "users_update_own_profile" on pm_profiles for update
  to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users_delete_own_profile" on pm_profiles for delete
  to authenticated using (auth.uid() = id);

-- pm_properties: properties assigned to users
create table if not exists pm_properties (
  id            uuid primary key default gen_random_uuid(),
  property_name text not null,
  address       text,
  unit_count    int default 1,
  company_id    uuid,
  zone_number   int,
  created_at    timestamptz default now()
);

alter table pm_properties enable row level security;

-- Junction table: users <-> properties
create table if not exists pm_property_assignments (
  user_id     uuid references auth.users(id) on delete cascade,
  property_id uuid references pm_properties(id) on delete cascade,
  primary key (user_id, property_id)
);

alter table pm_property_assignments enable row level security;

create policy "users_select_own_assignments" on pm_property_assignments for select
  to authenticated using (auth.uid() = user_id);
create policy "users_insert_own_assignments" on pm_property_assignments for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users_delete_own_assignments" on pm_property_assignments for delete
  to authenticated using (auth.uid() = user_id);

-- Allow users to see properties they're assigned to
create policy "users_select_assigned_properties" on pm_properties for select
  to authenticated using (
    id in (select property_id from pm_property_assignments where user_id = auth.uid())
  );

-- pm_service_requests: work orders
create table if not exists pm_service_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  property_id    uuid references pm_properties(id),
  unit_number    text,
  service_type   text not null,
  status         text not null default 'pending'
                   check (status in ('pending','scheduled','in_progress','completed','cancelled')),
  scheduled_date timestamptz,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table pm_service_requests enable row level security;

create policy "users_select_own_requests" on pm_service_requests for select
  to authenticated using (auth.uid() = user_id);
create policy "users_insert_own_requests" on pm_service_requests for insert
  to authenticated with check (auth.uid() = user_id);
create policy "users_update_own_requests" on pm_service_requests for update
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_delete_own_requests" on pm_service_requests for delete
  to authenticated using (auth.uid() = user_id);
