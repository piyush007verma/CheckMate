-- RentNest schema. Run once in Supabase Dashboard > SQL Editor. Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
create extension if not exists pgcrypto;

-- ============ TABLES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'seeker' check (role in ('seeker', 'owner')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  category text not null check (category in ('student', 'professional', 'family', 'individual')),
  property_type text not null,
  city text not null,
  locality text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  monthly_rent integer not null check (monthly_rent > 0),
  security_deposit integer not null default 0 check (security_deposit >= 0),
  bedrooms smallint not null default 1 check (bedrooms between 0 and 20),
  bathrooms smallint not null default 1 check (bathrooms between 0 and 20),
  furnishing text not null default 'Unfurnished' check (furnishing in ('Furnished', 'Semi-furnished', 'Unfurnished')),
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- Public-facing roommate card data only. No phone/email here by design.
create table if not exists public.roommate_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  age smallint check (age between 18 and 100),
  occupation text,
  city text not null,
  locality text,
  budget_min integer not null check (budget_min >= 0),
  budget_max integer not null,
  sharing_type text not null check (sharing_type in ('Private room', 'Shared room', 'Whole flat')),
  sleep text not null default 'flexible' check (sleep in ('early', 'night', 'flexible')),
  smoking text not null default 'no' check (smoking in ('no', 'yes')),
  diet text not null default 'any' check (diet in ('veg', 'non-veg', 'any')),
  social text not null default 'balanced' check (social in ('quiet', 'balanced', 'social')),
  bio text,
  move_in text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (budget_max >= budget_min)
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 5 and 20),
  message text check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- Added after the first release (safe to re-run): who a PG/hostel is for.
alter table public.properties add column if not exists pg_for text;
do $$ begin
  alter table public.properties add constraint properties_pg_for_check check (pg_for is null or pg_for in ('Boys', 'Girls', 'Co-ed'));
exception when duplicate_object then null; end $$;

-- Chat: one thread per enquiry. The enquiry's own message is the first bubble; replies live here.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index if not exists idx_messages_enquiry on public.messages(enquiry_id, created_at);
create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_properties_city on public.properties(lower(city));
create index if not exists idx_properties_category on public.properties(category);
create index if not exists idx_properties_rent on public.properties(monthly_rent);
create index if not exists idx_properties_available on public.properties(available) where available;
create index if not exists idx_favorites_property on public.favorites(property_id);
create index if not exists idx_roommates_city on public.roommate_profiles(lower(city)) where is_active;
create index if not exists idx_enquiries_property on public.enquiries(property_id);
create index if not exists idx_enquiries_sender on public.enquiries(sender_id);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when new.raw_user_meta_data ->> 'role' = 'owner' then 'owner' else 'seeker' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.favorites enable row level security;
alter table public.roommate_profiles enable row level security;
alter table public.enquiries enable row level security;
alter table public.messages enable row level security;

-- profiles: private. Only the user can see/edit their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- properties: public read, owner-only write.
drop policy if exists "properties_select_all" on public.properties;
create policy "properties_select_all" on public.properties for select using (true);
drop policy if exists "properties_insert_own" on public.properties;
create policy "properties_insert_own" on public.properties for insert with check (auth.uid() = owner_id);
drop policy if exists "properties_update_own" on public.properties;
create policy "properties_update_own" on public.properties for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "properties_delete_own" on public.properties;
create policy "properties_delete_own" on public.properties for delete using (auth.uid() = owner_id);

-- favorites: fully private.
drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- roommate_profiles: active cards are public; owners manage their own.
drop policy if exists "roommates_select_active" on public.roommate_profiles;
create policy "roommates_select_active" on public.roommate_profiles for select using (is_active or auth.uid() = user_id);
drop policy if exists "roommates_insert_own" on public.roommate_profiles;
create policy "roommates_insert_own" on public.roommate_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "roommates_update_own" on public.roommate_profiles;
create policy "roommates_update_own" on public.roommate_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "roommates_delete_own" on public.roommate_profiles;
create policy "roommates_delete_own" on public.roommate_profiles for delete using (auth.uid() = user_id);

-- enquiries: signed-in users send; sender and the property's owner can read; only the owner changes status.
drop policy if exists "enquiries_insert_auth" on public.enquiries;
create policy "enquiries_insert_auth" on public.enquiries for insert with check (auth.uid() = sender_id);
drop policy if exists "enquiries_select_parties" on public.enquiries;
create policy "enquiries_select_parties" on public.enquiries for select using (
  auth.uid() = sender_id
  or exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
);
drop policy if exists "enquiries_update_owner" on public.enquiries;
create policy "enquiries_update_owner" on public.enquiries for update
  using (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
-- NOTE: owners could edit other columns of an enquiry via the API; tighten with a column-level trigger if needed.

-- messages: only the two parties of the enquiry (the seeker who sent it, the owner of the property) can read and write.
create or replace function public.is_enquiry_party(eid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enquiries e join public.properties p on p.id = e.property_id
    where e.id = eid and (e.sender_id = auth.uid() or p.owner_id = auth.uid())
  );
$$;
drop policy if exists "messages_select_parties" on public.messages;
create policy "messages_select_parties" on public.messages for select using (public.is_enquiry_party(enquiry_id));
drop policy if exists "messages_insert_party" on public.messages;
create policy "messages_insert_party" on public.messages for insert with check (auth.uid() = sender_id and public.is_enquiry_party(enquiry_id));

-- Live chat updates (Supabase Realtime). The app also polls every 10 s as a fallback.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ============ STORAGE: property photos ============
insert into storage.buckets (id, name, public) values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_read" on storage.objects;
create policy "property_images_read" on storage.objects for select using (bucket_id = 'property-images');
drop policy if exists "property_images_insert_own" on storage.objects;
create policy "property_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "property_images_update_own" on storage.objects;
create policy "property_images_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "property_images_delete_own" on storage.objects;
create policy "property_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and (storage.foldername(name))[1] = auth.uid()::text);
