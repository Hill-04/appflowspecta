
-- Add reminder and pinned note fields to campaign_leads
ALTER TABLE public.campaign_leads 
  ADD COLUMN reminder_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN pinned_note text DEFAULT NULL;
