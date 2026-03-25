
-- Fix campaign_leads RLS: also verify lead ownership
DROP POLICY IF EXISTS "Users manage own campaign_leads" ON public.campaign_leads;

CREATE POLICY "Users manage own campaign_leads"
ON public.campaign_leads
FOR ALL
USING (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id))
WITH CHECK (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id));

-- Fix campaign_lead_notes RLS: also verify lead ownership
DROP POLICY IF EXISTS "Users manage own campaign_lead_notes" ON public.campaign_lead_notes;

CREATE POLICY "Users manage own campaign_lead_notes"
ON public.campaign_lead_notes
FOR ALL
USING (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id))
WITH CHECK (is_owner_of_campaign(campaign_id) AND is_owner_of_lead(lead_id));
