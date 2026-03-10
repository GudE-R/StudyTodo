-- Migration to add ON DELETE CASCADE to foreign keys referencing auth.users
-- This ensures that when a user is deleted via the 'delete_user' RPC,
-- all related records in public tables are automatically removed.

-- 1. categories table
ALTER TABLE public.categories
DROP CONSTRAINT IF EXISTS categories_user_id_fkey,
ADD CONSTRAINT categories_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 2. srs_profiles table
ALTER TABLE public.srs_profiles
DROP CONSTRAINT IF EXISTS srs_profiles_user_id_fkey,
ADD CONSTRAINT srs_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 3. todos table
ALTER TABLE public.todos
DROP CONSTRAINT IF EXISTS todos_user_id_fkey,
ADD CONSTRAINT todos_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 4. feedbacks table
-- Note: feedbacks user_id might be nullable (anonymous feedback support), 
-- but if a user is deleted, we cascade delete their feedback as well.
ALTER TABLE public.feedbacks
DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey,
ADD CONSTRAINT feedbacks_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 5. communications table
ALTER TABLE public.communications
DROP CONSTRAINT IF EXISTS communications_user_id_fkey,
ADD CONSTRAINT communications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
