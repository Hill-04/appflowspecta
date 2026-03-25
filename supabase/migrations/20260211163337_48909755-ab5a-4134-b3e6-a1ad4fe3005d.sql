
-- 1. Add lead_profile_mode and lead_model_configured to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lead_profile_mode text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lead_model_configured boolean NOT NULL DEFAULT false;

-- 2. Add prospecting_status to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS prospecting_status text NOT NULL DEFAULT 'not_started';

-- 3. Create lead_models table
CREATE TABLE IF NOT EXISTS public.lead_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lead_models"
  ON public.lead_models
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Trigger: ensure only one active lead_model per user
CREATE OR REPLACE FUNCTION public.ensure_single_active_lead_model()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.lead_models
    SET is_active = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_active_lead_model
  BEFORE INSERT OR UPDATE ON public.lead_models
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_lead_model();

-- 5. Trigger: auto-update campaign prospecting_status when lead status changes
CREATE OR REPLACE FUNCTION public.auto_update_prospecting_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  -- Only act on status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT prospecting_status INTO current_status
  FROM public.campaigns
  WHERE id = NEW.campaign_id;

  -- pending -> anything else: move to in_progress if was not_started
  IF OLD.status = 'pending' AND NEW.status != 'pending' AND current_status = 'not_started' THEN
    UPDATE public.campaigns SET prospecting_status = 'in_progress' WHERE id = NEW.campaign_id;
  END IF;

  -- any -> interested: move to leads_responding
  IF NEW.status = 'interested' AND current_status != 'leads_responding' THEN
    UPDATE public.campaigns SET prospecting_status = 'leads_responding' WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_prospecting_status
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_prospecting_status();
