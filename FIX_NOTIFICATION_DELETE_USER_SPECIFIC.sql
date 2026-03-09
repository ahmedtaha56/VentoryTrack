-- ==========================================
-- NOTIFICATION DELETION FIX
-- User-Specific Deletion Policy
-- ==========================================
-- 
-- DESCRIPTION:
-- When a user deletes a notification, it should only be deleted FOR THAT USER,
-- not for the entire team. Other team members should continue to see their copy
-- of the notification until they delete it themselves.
--
-- IMPLEMENTATION:
-- - Each notification has a user_id that identifies the owner
-- - Deletion is restricted by RLS to only delete when auth.uid() = user_id
-- - Frontend only deletes by notification ID + user_id
-- ==========================================

-- Step 1: Enable RLS on notifications table (if not already enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop conflicting policies that allow admin deletion
DROP POLICY IF EXISTS "Admins can delete any notification" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own or any notification if admin" ON public.notifications;

-- Step 3: Create the correct policy - Users can ONLY delete their OWN notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Step 4: Verify SELECT policy exists
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Step 5: Ensure INSERT policy allows system to create notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- After running this SQL, verify the policies are correct:
--
-- SELECT policyname, poltype 
-- FROM pg_policies 
-- WHERE tablename = 'notifications';
--
-- You should see:
-- - "Users can view their own notifications" (SELECT)
-- - "Users can delete their own notifications" (DELETE)
-- - "Anyone can insert notifications" (INSERT)
--
-- ==========================================

COMMIT;
