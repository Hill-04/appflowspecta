-- Block ALL client-side access to pending_purchases
-- This table is only accessed by edge functions using service_role key
CREATE POLICY "No client access to pending_purchases"
ON public.pending_purchases
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Block anonymous access too
CREATE POLICY "No anon access to pending_purchases"
ON public.pending_purchases
FOR ALL
TO anon
USING (false)
WITH CHECK (false);