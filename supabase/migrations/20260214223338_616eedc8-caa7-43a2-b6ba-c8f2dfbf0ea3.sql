
-- Create the trigger function (already exists but re-create to be safe)
CREATE OR REPLACE FUNCTION public.auto_set_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.current_step_id IS DISTINCT FROM OLD.current_step_id THEN
    IF NEW.converted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.message_steps
      WHERE id = NEW.current_step_id
        AND is_conversion = true
    ) THEN
      NEW.converted_at = now();
      NEW.status = 'interested';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on campaign_leads
DROP TRIGGER IF EXISTS trg_auto_conversion ON public.campaign_leads;
CREATE TRIGGER trg_auto_conversion
  BEFORE UPDATE ON public.campaign_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_conversion();
