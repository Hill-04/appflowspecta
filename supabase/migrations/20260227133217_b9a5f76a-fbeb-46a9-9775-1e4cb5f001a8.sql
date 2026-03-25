
-- Fix the security definer view by setting it to security invoker
ALTER VIEW public.user_calendar_status SET (security_invoker = on);

-- We need a permissive SELECT policy on the base table so the view works for authenticated users
-- But only expose non-sensitive data through the view
CREATE POLICY "Users select own calendar connections"
ON public.user_calendar_connections
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
