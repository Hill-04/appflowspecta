
-- Add strategic profile columns to profiles
ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN offer_type text;
ALTER TABLE public.profiles ADD COLUMN target_audience_description text;
ALTER TABLE public.profiles ADD COLUMN main_pain text;
ALTER TABLE public.profiles ADD COLUMN differential text;
ALTER TABLE public.profiles ADD COLUMN maturity_level text;
ALTER TABLE public.profiles ADD COLUMN contact_channel text;
ALTER TABLE public.profiles ADD COLUMN average_ticket text;

-- Replace handle_new_user to only create profile (no seed data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;
