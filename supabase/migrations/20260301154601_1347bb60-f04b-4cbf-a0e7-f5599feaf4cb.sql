-- Fix lead name updates: remove incorrect trigger attached to public.leads
-- This trigger calls auto_update_prospecting_status(), which expects NEW.campaign_id,
-- a column that does not exist in public.leads.
DROP TRIGGER IF EXISTS trg_auto_prospecting_status ON public.leads;