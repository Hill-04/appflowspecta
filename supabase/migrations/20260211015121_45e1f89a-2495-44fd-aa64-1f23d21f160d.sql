ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS objective text;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS audience_id uuid;