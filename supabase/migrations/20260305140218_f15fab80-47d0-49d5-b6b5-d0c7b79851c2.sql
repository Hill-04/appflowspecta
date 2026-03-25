ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS proof_results text,
ADD COLUMN IF NOT EXISTS positioning text,
ADD COLUMN IF NOT EXISTS strategic_notes text;