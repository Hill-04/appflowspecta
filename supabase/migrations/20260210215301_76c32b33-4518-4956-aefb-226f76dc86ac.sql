-- Fix: update enforce_leads_user_id to allow inserts from the handle_new_user trigger
-- During signup, auth.uid() is NULL but the trigger runs as a privileged function
CREATE OR REPLACE FUNCTION enforce_leads_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation when called from handle_new_user (signup context where auth.uid() is NULL)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;