
-- Add new columns to prospecting_goals
ALTER TABLE public.prospecting_goals
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS funnel_stage_id uuid REFERENCES public.message_steps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS custom_days integer[] DEFAULT '{}';
