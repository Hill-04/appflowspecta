
-- 1. Create campaign_field_definitions table
CREATE TABLE public.campaign_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'short_text',
  field_order integer NOT NULL DEFAULT 0,
  options jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaign_field_definitions"
  ON public.campaign_field_definitions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Create lead_field_values table
CREATE TABLE public.lead_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.campaign_field_definitions(id) ON DELETE CASCADE,
  value text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, lead_id, field_id)
);

ALTER TABLE public.lead_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lead_field_values"
  ON public.lead_field_values
  FOR ALL
  USING (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id))
  WITH CHECK (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id));

-- 3. Add priority column to campaign_leads
ALTER TABLE public.campaign_leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
