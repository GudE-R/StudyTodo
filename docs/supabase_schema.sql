-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories Table
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  color text,
  "order" integer default 0,
  parent_id uuid references public.categories(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.categories enable row level security;
create policy "Users can CRUD their own categories" on public.categories
  for all using (auth.uid() = user_id);

-- 2. SRS Profiles Table
create table public.srs_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  intervals jsonb not null, -- Array of numbers
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.srs_profiles enable row level security;
create policy "Users can CRUD their own SRS profiles" on public.srs_profiles
  for all using (auth.uid() = user_id);

-- 3. Todos Table
create table public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  completed boolean default false,
  due_date timestamp with time zone,
  priority text default 'medium',
  estimated_time integer, -- minutes
  category_id uuid references public.categories(id),
  srs_profile_id uuid references public.srs_profiles(id),
  srs_level integer default 0,
  next_review_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.todos enable row level security;
create policy "Users can CRUD their own todos" on public.todos
  for all using (auth.uid() = user_id);

-- 4. Sessions Table (Learning Records)
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  todo_id uuid references public.todos(id), -- Nullable if todo is deleted? Let's keep referential integrity or set null
  todo_title text, -- Snapshot of title
  duration integer not null, -- seconds
  mode text default 'pomodoro',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.sessions enable row level security;
create policy "Users can CRUD their own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- 5. Indexes for performance
create index categories_user_id_idx on public.categories(user_id);
create index todos_user_id_idx on public.todos(user_id);
create index sessions_user_id_idx on public.sessions(user_id);
