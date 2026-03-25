
-- Owner can SELECT ALL profiles
CREATE POLICY "Owner can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'));

-- Owner can SELECT ALL subscriptions
CREATE POLICY "Owner can read all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'));

-- Owner can SELECT ALL user_roles
CREATE POLICY "Owner can read all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'owner'));

-- Owner can INSERT user_roles
CREATE POLICY "Owner can insert user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'owner'));

-- Owner can UPDATE user_roles
CREATE POLICY "Owner can update user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'owner'));

-- Owner can DELETE user_roles
CREATE POLICY "Owner can delete user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'owner'));
