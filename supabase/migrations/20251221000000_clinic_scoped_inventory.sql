-- Ensures clinic-scoped data isolation for inventory-related tables.
-- This migration is intended to make the database reproducible from git and
-- enforce that inventory, lots, locations, transactions, and invitations are clinic-specific.
--
-- NOTE: This is written to be reasonably idempotent for existing environments.

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies (SECURITY DEFINER, stable)
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns text
language sql
stable security definer
set search_path to 'public'
as $$
  select (
    select u.user_role::text
    from public.users u
    where u.user_id = auth.uid()
  );
$$;

create or replace function public.current_user_clinic_ids()
returns uuid[]
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce(
    (
      select array_remove(
        array_cat(coalesce(u.clinic_ids, array[]::uuid[]), array[u.clinic_id]),
        null
      )
      from public.users u
      where u.user_id = auth.uid()
    ),
    array[]::uuid[]
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce(
    (
      select (u.user_role::text = any(array['admin','superadmin']))
      from public.users u
      where u.user_id = auth.uid()
    ),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Enforce clinic_id presence and referential integrity (including composite FKs)
-- ---------------------------------------------------------------------------

do $$
begin
  -- Unique constraints needed for composite foreign keys
  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'locations_location_id_clinic_id_key'
  ) then
    alter table public.locations
      add constraint locations_location_id_clinic_id_key unique (location_id, clinic_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'lots_lot_id_clinic_id_key'
  ) then
    alter table public.lots
      add constraint lots_lot_id_clinic_id_key unique (lot_id, clinic_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'units_unit_id_clinic_id_key'
  ) then
    alter table public.units
      add constraint units_unit_id_clinic_id_key unique (unit_id, clinic_id);
  end if;

  -- Composite foreign keys prevent cross-clinic linking
  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'lots_location_clinic_fkey'
  ) then
    alter table public.lots
      add constraint lots_location_clinic_fkey
      foreign key (location_id, clinic_id)
      references public.locations(location_id, clinic_id)
      on update cascade
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'units_lot_clinic_fkey'
  ) then
    alter table public.units
      add constraint units_lot_clinic_fkey
      foreign key (lot_id, clinic_id)
      references public.lots(lot_id, clinic_id)
      on update cascade
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where connamespace = 'public'::regnamespace
      and conname = 'transactions_unit_clinic_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_unit_clinic_fkey
      foreign key (unit_id, clinic_id)
      references public.units(unit_id, clinic_id)
      on update cascade
      on delete restrict;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS policies: clinic-scoped access
-- ---------------------------------------------------------------------------

alter table public.clinics enable row level security;
alter table public.users enable row level security;
alter table public.locations enable row level security;
alter table public.lots enable row level security;
alter table public.units enable row level security;
alter table public.transactions enable row level security;
alter table public.invitations enable row level security;

-- Make policy creation idempotent by dropping known names first.
drop policy if exists clinic_multi_access on public.clinics;
drop policy if exists clinic_select on public.clinics;
drop policy if exists clinic_update on public.clinics;
drop policy if exists clinic_insert on public.clinics;

create policy clinic_select on public.clinics
  for select
  using (clinic_id = any(public.current_user_clinic_ids()));

create policy clinic_update on public.clinics
  for update
  using ((clinic_id = any(public.current_user_clinic_ids())) and (public.current_user_role() = 'superadmin'))
  with check ((clinic_id = any(public.current_user_clinic_ids())) and (public.current_user_role() = 'superadmin'));

-- Allow superadmins to create clinics (used by create clinic flow)
create policy clinic_insert on public.clinics
  for insert
  with check (public.current_user_role() = 'superadmin');

-- Users table policies (keep signup insert policy)
drop policy if exists user_multi_clinic_isolation on public.users;
drop policy if exists user_select on public.users;
drop policy if exists user_update_own on public.users;
drop policy if exists user_insert_own on public.users;

create policy user_select on public.users
  for select
  using ((user_id = auth.uid()) or (clinic_id = any(public.current_user_clinic_ids())));

create policy user_update_own on public.users
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_insert_own on public.users
  for insert
  with check (user_id = auth.uid());

-- Clinic-scoped inventory tables
drop policy if exists location_multi_clinic_isolation on public.locations;
drop policy if exists location_clinic_access on public.locations;
create policy location_clinic_access on public.locations
  for all
  using (clinic_id = any(public.current_user_clinic_ids()))
  with check (clinic_id = any(public.current_user_clinic_ids()));

drop policy if exists lot_multi_clinic_isolation on public.lots;
drop policy if exists lot_clinic_access on public.lots;
create policy lot_clinic_access on public.lots
  for all
  using (clinic_id = any(public.current_user_clinic_ids()))
  with check (clinic_id = any(public.current_user_clinic_ids()));

drop policy if exists unit_multi_clinic_isolation on public.units;
drop policy if exists unit_clinic_access on public.units;
create policy unit_clinic_access on public.units
  for all
  using (clinic_id = any(public.current_user_clinic_ids()))
  with check (clinic_id = any(public.current_user_clinic_ids()));

drop policy if exists transaction_multi_clinic_isolation on public.transactions;
drop policy if exists transaction_clinic_access on public.transactions;
create policy transaction_clinic_access on public.transactions
  for all
  using (clinic_id = any(public.current_user_clinic_ids()))
  with check (clinic_id = any(public.current_user_clinic_ids()));

-- Invitations: clinic admins/superadmins only (token policy is separate)
drop policy if exists invitation_isolation on public.invitations;
drop policy if exists invitation_clinic_admin_access on public.invitations;
create policy invitation_clinic_admin_access on public.invitations
  for all
  using (public.is_admin() and (clinic_id = any(public.current_user_clinic_ids())))
  with check (public.is_admin() and (clinic_id = any(public.current_user_clinic_ids())));

drop policy if exists invitation_token_access on public.invitations;
create policy invitation_token_access on public.invitations
  for select
  using (true);

