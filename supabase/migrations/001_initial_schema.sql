-- ============================================================
-- Profiles table (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
exception when others then
  raise warning 'handle_new_user failed for user %: %', new.id, sqlerrm;
  return new; -- allow signup to proceed even if profile creation fails
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Pets table
-- ============================================================
create table public.pets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  species text not null check (species in ('cat', 'dog', 'other')),
  breed text,
  age int check (age >= 0), -- age in months
  gender text not null check (gender in ('male', 'female')),
  description text,
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  image_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- Applications table
-- ============================================================
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamptz default now(),
  unique(user_id, pet_id)
);

create index on public.applications(pet_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.applications enable row level security;

-- Profiles: users can read and update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Admins can view all profiles (needed for application review)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Pets: anyone can read; only admins can write
create policy "Anyone can view pets"
  on public.pets for select using (true);
create policy "Admins can insert pets"
  on public.pets for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update pets"
  on public.pets for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete pets"
  on public.pets for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Applications: users can view and create their own; admins can view and update all
create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
create policy "Users can create applications"
  on public.applications for insert
  with check (auth.uid() = user_id);
create policy "Admins can update applications"
  on public.applications for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
