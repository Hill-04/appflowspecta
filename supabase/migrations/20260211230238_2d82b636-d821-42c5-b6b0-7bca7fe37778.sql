
-- Fix: drop trigger with correct name, then cascade function, rename table, cleanup

-- 1. Drop trigger (correct name from db-triggers)
DROP TRIGGER IF EXISTS trg_single_active_lead_model ON public.lead_models;

-- 2. Drop function 
DROP FUNCTION IF EXISTS public.ensure_single_active_lead_model() CASCADE;

-- 3. Rename table
ALTER TABLE public.lead_models RENAME TO lead_templates;

-- 4. Drop is_active column
ALTER TABLE public.lead_templates DROP COLUMN IF EXISTS is_active;

-- 5. Drop legacy profile columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS lead_profile_mode;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS lead_model_configured;

-- 6. Rename RLS policy
ALTER POLICY "Users manage own lead_models" ON public.lead_templates RENAME TO "Users manage own lead_templates";
