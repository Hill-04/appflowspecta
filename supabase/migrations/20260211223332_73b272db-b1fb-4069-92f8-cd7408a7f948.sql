
-- 1) Adicionar colunas novas em leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_model_id uuid REFERENCES public.lead_models(id) ON DELETE SET NULL;

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS custom_data jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Criar campaign_leads com RLS correto
CREATE TABLE public.campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_index integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaign_leads"
ON public.campaign_leads
FOR ALL
USING (
  public.is_owner_of_campaign(campaign_id)
)
WITH CHECK (
  public.is_owner_of_campaign(campaign_id)
);

-- 3) Migração segura com validação (só leads com campaign_id válido)
INSERT INTO public.campaign_leads (campaign_id, lead_id, step_index, status)
SELECT l.campaign_id, l.id, l.step_index, l.status
FROM public.leads l
JOIN public.campaigns c ON c.id = l.campaign_id
WHERE l.campaign_id IS NOT NULL;

-- 6) Trigger correto (INSERT + UPDATE) na campaign_leads
DROP TRIGGER IF EXISTS trigger_auto_update_prospecting_status ON public.leads;

CREATE OR REPLACE FUNCTION public.auto_update_prospecting_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT prospecting_status INTO current_status
  FROM public.campaigns
  WHERE id = NEW.campaign_id;

  IF current_status = 'not_started' THEN
    UPDATE public.campaigns
    SET prospecting_status = 'in_progress'
    WHERE id = NEW.campaign_id;
  END IF;

  IF NEW.status = 'interested' AND current_status != 'leads_responding' THEN
    UPDATE public.campaigns
    SET prospecting_status = 'leads_responding'
    WHERE id = NEW.campaign_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_update_prospecting_status
AFTER INSERT OR UPDATE ON public.campaign_leads
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_prospecting_status();
