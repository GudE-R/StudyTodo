-- Add missing columns to 'todos'
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS memo text;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS range text;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS srs_interval text;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS actual_duration integer default 0;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS tags jsonb;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS review_history jsonb;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS srs_group_id uuid;

-- Add missing columns to 'categories'
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default boolean default false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null; -- Assuming it was missing or just ensuring

-- Add missing columns to 'srs_profiles'
ALTER TABLE public.srs_profiles ADD COLUMN IF NOT EXISTS is_default boolean default false;
ALTER TABLE public.srs_profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Ensure sessions table has necessary columns (seems mostly fine based on schema.sql, but check startTime/endTime)
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS start_time timestamp with time zone;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS end_time timestamp with time zone;
