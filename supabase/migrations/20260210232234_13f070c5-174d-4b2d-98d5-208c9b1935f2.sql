
-- Allow users to update their own profile (needed for onboarding)
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
