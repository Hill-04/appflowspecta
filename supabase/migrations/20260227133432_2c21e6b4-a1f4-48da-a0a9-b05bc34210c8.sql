
-- Drop the overly restrictive policy that blocks everything including SELECT
DROP POLICY IF EXISTS "No client access to calendar connections" ON public.user_calendar_connections;

-- Create restrictive policies only for write operations (INSERT, UPDATE, DELETE)
-- This blocks clients from writing tokens directly, while allowing SELECT through the permissive policy
CREATE POLICY "No client insert to calendar connections"
ON public.user_calendar_connections
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No client update to calendar connections"
ON public.user_calendar_connections
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No client delete to calendar connections"
ON public.user_calendar_connections
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);
