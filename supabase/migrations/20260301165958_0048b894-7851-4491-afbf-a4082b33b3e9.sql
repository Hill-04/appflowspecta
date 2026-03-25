ALTER TABLE public.prospecting_goals ADD COLUMN IF NOT EXISTS deadline date;
ALTER TABLE public.prospecting_goals ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;