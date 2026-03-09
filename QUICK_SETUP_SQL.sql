-- ==========================================
-- QUICK SETUP SQL - COPY & PASTE THIS
-- ==========================================

-- ==========================================
-- TABLE CREATION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_user_id 
ON public.staff_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_feature_key 
ON public.staff_permissions(feature_key);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RPC FUNCTION 1: GET USER FEATURES
-- ==========================================

-- Drop old function if exists with different signature
DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;

CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (
  feature_key VARCHAR,
  feature_name VARCHAR,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
SELECT 
  sp.feature_key,
  sp.feature_key as feature_name,
  sp.can_view,
  sp.can_create,
  sp.can_update,
  sp.can_delete
FROM public.staff_permissions sp
WHERE sp.user_id = p_user_id
ORDER BY sp.feature_key;
$$;

GRANT EXECUTE ON FUNCTION get_user_features(UUID) TO authenticated;

-- ==========================================
-- RPC FUNCTION 2: UPDATE STAFF PERMISSION
-- ==========================================

-- Drop old function if exists with different signature
DROP FUNCTION IF EXISTS update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION update_staff_permission(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_can_view BOOLEAN,
  p_can_create BOOLEAN,
  p_can_update BOOLEAN,
  p_can_delete BOOLEAN
)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result_data JSON;
BEGIN
  INSERT INTO public.staff_permissions (
    user_id,
    feature_key,
    can_view,
    can_create,
    can_update,
    can_delete,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_feature_key,
    p_can_view,
    p_can_create,
    p_can_update,
    p_can_delete,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, feature_key)
  DO UPDATE SET
    can_view = p_can_view,
    can_create = p_can_create,
    can_update = p_can_update,
    can_delete = p_can_delete,
    updated_at = NOW();

  SELECT json_build_object(
    'success', true,
    'feature_key', p_feature_key,
    'message', 'Permission updated successfully'
  ) INTO result_data;

  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'staff_permissions';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name = 'get_user_features' OR routine_name = 'update_staff_permission');
