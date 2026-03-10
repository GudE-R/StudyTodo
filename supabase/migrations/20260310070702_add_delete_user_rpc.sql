-- Add RPC for securely deleting the current authenticated user
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
BEGIN
  -- Check if the current user exists in auth.users before deleting
  -- This operates at the database level and uses the current authenticated uid
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: CASCADE deletes (if configured on auth.users referential constraints) 
-- will automatically clean up child records like 'todos', 'sessions', etc.
