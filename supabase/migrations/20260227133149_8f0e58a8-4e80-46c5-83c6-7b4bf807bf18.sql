
-- Drop the existing permissive ALL policy that exposes tokens to clients
DROP POLICY IF EXISTS "Users manage own calendar connections" ON public.user_calendar_connections;

-- Create a view that excludes sensitive token columns for client-side use
CREATE OR REPLACE VIEW public.user_calendar_status AS
SELECT id, user_id, provider, calendar_id, connected_at, expiry_date, updated_at
FROM public.user_calendar_connections;

-- Allow authenticated users to select from the view (filtered by RLS on underlying table)
-- Since views inherit RLS from base tables, we need RLS on the base table for SELECT too
-- But we want to restrict what columns are visible

-- New policy: Block ALL client access to the raw table (service role bypasses RLS)
CREATE POLICY "No client access to calendar connections"
ON public.user_calendar_connections
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Also block anon access
CREATE POLICY "No anon access to calendar connections"
ON public.user_calendar_connections
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
