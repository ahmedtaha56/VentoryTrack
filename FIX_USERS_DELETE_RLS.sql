-- ==========================================
-- FIX: Enable RLS and Policies for Users Table
-- ==========================================

-- Step 1: Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create DELETE policy for managers and admins
CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = auth.uid()
    AND feature_key = 'users'
    AND can_delete = true
  )
  OR
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Step 3: Create a safe RPC function for deleting users
DROP FUNCTION IF EXISTS safe_delete_staff_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION safe_delete_staff_user(p_user_id UUID)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_current_user_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  -- Check if current user has delete permission
  v_has_permission := EXISTS (
    SELECT 1 FROM public.staff_permissions
    WHERE user_id = v_current_user_id
    AND feature_key = 'users'
    AND can_delete = true
  );
  
  -- Also allow admins
  IF NOT v_has_permission THEN
    v_has_permission := EXISTS (
      SELECT 1 FROM public.users
      WHERE id = v_current_user_id
      AND role = 'admin'
    );
  END IF;

  -- If no permission, return error
  IF NOT v_has_permission THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions to delete users');
  END IF;

  -- Delete staff permissions first
  DELETE FROM public.staff_permissions WHERE user_id = p_user_id;
  
  -- Delete user profile
  DELETE FROM public.users WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'User deleted successfully');

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safe_delete_staff_user(UUID) TO authenticated;
