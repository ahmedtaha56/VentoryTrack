-- ==========================================
-- NOTIFICATION DELETION FIX
-- Admin Can Delete For Entire Team
-- ==========================================
-- 
-- DESCRIPTION:
-- When an admin deletes a notification, it should be deleted for the ENTIRE team,
-- and all users should see it deleted in real-time.
--
-- KEY: SELECT policy must allow viewing ALL notifications for real-time to work
-- ==========================================

-- Step 1: Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: SELECT policy - Users can see ALL notifications (required for real-time)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications"
ON public.notifications FOR SELECT
USING (true);

-- Step 3: DELETE policy - Admins can delete any, Staff can delete their own
DROP POLICY IF EXISTS "Users can delete their own or any notification if admin" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete any notification" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;

CREATE POLICY "Users can delete notifications"
ON public.notifications FOR DELETE
USING (
  -- Admin can delete any notification
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR
  -- Or user can delete their own notification
  auth.uid() = user_id
);

-- Step 4: INSERT policy
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ==========================================
-- VERIFICATION
-- ==========================================
-- After running this SQL, verify:
--
-- SELECT policyname, cmd
-- FROM pg_policies 
-- WHERE tablename = 'notifications';
--
-- You should see:
-- - "Users can view notifications" (SELECT)
-- - "Users can delete notifications" (DELETE)
-- - "Anyone can insert notifications" (INSERT)
-- ==========================================

COMMIT;


