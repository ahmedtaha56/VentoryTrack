-- Create RPC function to safely delete users
-- This function can be called by authenticated users with proper permissions
-- The Supabase service role will execute it with elevated privileges

CREATE OR REPLACE FUNCTION delete_user_by_id(user_id_to_delete UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check if the current user is an admin or manager
  IF NOT EXISTS (
    SELECT 1 FROM staff_permissions 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR (role = 'manager' AND can_delete = true))
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Delete from staff_permissions
  DELETE FROM staff_permissions WHERE user_id = user_id_to_delete;

  -- Delete from users table
  DELETE FROM users WHERE id = user_id_to_delete;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_by_id(UUID) TO authenticated;
