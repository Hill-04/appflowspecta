-- CORREÇÃO DE COLUNAS PARA TABELAS EXISTENTES
-- Cole e rode este script no SQL Editor

-- 1. Arrumar CAMPAIGNS
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS audience_id UUID REFERENCES public.audiences(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS prospecting_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS investment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS script_set_id UUID REFERENCES public.script_sets(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS default_lead_template_id UUID REFERENCES public.lead_templates(id) ON DELETE SET NULL;

-- 2. Arrumar LEADS
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS lead_model_id UUID REFERENCES public.lead_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- 3. Garantir PLAN_LIMITS está correta
INSERT INTO public.plan_limits (plan, max_users, max_active_campaigns, max_audiences, features)
VALUES 
('free', 1, 1, 1, '{"ai_insights": false, "custom_scripts": false}'),
('pro', 3, 5, 10, '{"ai_insights": true, "custom_scripts": true}'),
('scale', -1, -1, -1, '{"ai_insights": true, "custom_scripts": true}')
ON CONFLICT (plan) DO UPDATE SET
  max_users = EXCLUDED.max_users,
  max_active_campaigns = EXCLUDED.max_active_campaigns,
  max_audiences = EXCLUDED.max_audiences,
  features = EXCLUDED.features;
