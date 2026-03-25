
-- =============================================
-- 1. Campaign Templates
-- =============================================
CREATE TABLE public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaign_templates"
  ON public.campaign_templates FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.campaign_template_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL DEFAULT '',
  step_order INTEGER NOT NULL DEFAULT 1,
  is_conversion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_template_steps ENABLE ROW LEVEL SECURITY;

-- RLS via parent ownership
CREATE OR REPLACE FUNCTION public.is_owner_of_campaign_template(_template_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_templates
    WHERE id = _template_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users manage own campaign_template_steps"
  ON public.campaign_template_steps FOR ALL
  USING (is_owner_of_campaign_template(template_id))
  WITH CHECK (is_owner_of_campaign_template(template_id));

-- Link campaigns to template used
ALTER TABLE public.campaigns ADD COLUMN campaign_template_id UUID REFERENCES public.campaign_templates(id) ON DELETE SET NULL;

-- =============================================
-- 2. Script Sets
-- =============================================
CREATE TABLE public.script_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.script_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own script_sets"
  ON public.script_sets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.script_set_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES public.script_sets(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.script_set_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_owner_of_script_set(_set_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.script_sets
    WHERE id = _set_id AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Users manage own script_set_items"
  ON public.script_set_items FOR ALL
  USING (is_owner_of_script_set(set_id))
  WITH CHECK (is_owner_of_script_set(set_id));

-- Link campaigns to script set
ALTER TABLE public.campaigns ADD COLUMN script_set_id UUID REFERENCES public.script_sets(id) ON DELETE SET NULL;
