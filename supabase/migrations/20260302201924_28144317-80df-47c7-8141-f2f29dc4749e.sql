
ALTER TABLE public.campaign_leads 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.campaign_leads SET updated_at = created_at WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_campaign_leads_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_campaign_leads_updated_at
  BEFORE UPDATE ON public.campaign_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_leads_updated_at();
