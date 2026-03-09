-- ==========================================
-- RPC FUNCTION FOR ADMIN NOTIFICATION DELETE
-- ==========================================
-- This function allows admins to delete notifications for the entire team
-- by message. Only admins can call this function successfully.

DROP FUNCTION IF EXISTS delete_notification_by_id(UUID) CASCADE;

CREATE OR REPLACE FUNCTION delete_notification_by_id(p_notification_id UUID)
RETURNS JSON
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_deleted_count INTEGER;
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_notif_exists BOOLEAN;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Check if notification exists
  v_notif_exists := EXISTS (
    SELECT 1 FROM public.notifications 
    WHERE id = p_notification_id
  );
  
  RAISE NOTICE 'DEBUG: delete_notification_by_id called';
  RAISE NOTICE 'DEBUG: p_notification_id = %', p_notification_id;
  RAISE NOTICE 'DEBUG: current_user = %', v_current_user_id;
  RAISE NOTICE 'DEBUG: notification_exists = %', v_notif_exists;
  
  -- Check if current user is admin
  v_is_admin := EXISTS (
    SELECT 1 FROM public.users
    WHERE id = v_current_user_id
    AND role = 'admin'
  );
  
  RAISE NOTICE 'DEBUG: is_admin = %', v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE NOTICE 'DEBUG: User is not admin, returning error';
    RETURN json_build_object(
      'success', false,
      'error', 'Only admins can delete notifications'
    );
  END IF;
  
  -- Delete the notification (RLS policy will enforce admin check)
  DELETE FROM public.notifications
  WHERE id = p_notification_id;
  
  -- Get affected row count
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'DEBUG: rows_deleted = %', v_deleted_count;
  
  IF v_deleted_count = 0 THEN
    RAISE NOTICE 'DEBUG: No rows deleted';
    RETURN json_build_object(
      'success', false,
      'error', 'Notification not found or already deleted'
    );
  END IF;
  
  RAISE NOTICE 'DEBUG: Delete successful, returning success';
  RETURN json_build_object(
    'success', true,
    'message', 'Notification deleted for entire team',
    'notification_id', p_notification_id,
    'deleted_count', v_deleted_count
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'DEBUG: Exception occurred - %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_notification_by_id(UUID) TO authenticated;

-- ==========================================
-- VERIFICATION
-- Run this query to verify function was created:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'delete_notifications_by_message';
-- ==========================================
