-- ==========================================
-- CLEANUP: Remove Duplicate and Conflicting Policies
-- ==========================================

-- Drop all INSERT policies (keeping only one clean policy)
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create ONE clean INSERT policy
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Keep SELECT policy as is (allows viewing all notifications)
-- DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
-- CREATE POLICY "Users can view notifications"
-- ON public.notifications FOR SELECT
-- USING (true);

-- Keep DELETE policy (admins can delete any, others can delete own)
-- DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;
-- CREATE POLICY "Users can delete notifications"
-- ON public.notifications FOR DELETE
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.users 
--     WHERE id = auth.uid() 
--     AND role = 'admin'
--   )
--   OR
--   auth.uid() = user_id
-- );

-- Update UPDATE policy to have WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- FINAL POLICIES (after cleanup)
-- ==========================================
-- 1. SELECT: USING (true) - Everyone sees all notifications
-- 2. INSERT: WITH CHECK (true) - System can insert for anyone
-- 3. DELETE: Admins can delete any, others can delete own
-- 4. UPDATE: Users can update their own only
-- ==========================================

COMMIT;
