-- FLOWSPECTA - FULL SCHEMA SETUP
-- Cole este script no SQL Editor do seu Supabase Dashboard

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Atualizar tabela de PROFILES com colunas ausentes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_name TEXT,
ADD COLUMN IF NOT EXISTS treatment_type TEXT,
ADD COLUMN IF NOT EXISTS personal_profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_type TEXT,
ADD COLUMN IF NOT EXISTS target_audience_description TEXT,
ADD COLUMN IF NOT EXISTS main_pain TEXT,
ADD COLUMN IF NOT EXISTS differential TEXT,
ADD COLUMN IF NOT EXISTS average_ticket TEXT,
ADD COLUMN IF NOT EXISTS contact_channel TEXT,
ADD COLUMN IF NOT EXISTS orion_welcomed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS orion_tour_step INTEGER DEFAULT 0;

-- 3. Tabela de LEAD_TEMPLATES
CREATE TABLE IF NOT EXISTS public.lead_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de AUDIENCES
CREATE TABLE IF NOT EXISTS public.audiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT,
  criteria TEXT[] DEFAULT '{}',
  size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de SCRIPT_SETS
CREATE TABLE IF NOT EXISTS public.script_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabela de SCRIPT_SET_ITEMS
CREATE TABLE IF NOT EXISTS public.script_set_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID REFERENCES public.script_sets(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela de CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audience_id UUID REFERENCES public.audiences(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  prospecting_status TEXT DEFAULT 'not_started',
  investment NUMERIC DEFAULT 0,
  script_set_id UUID REFERENCES public.script_sets(id) ON DELETE SET NULL,
  default_lead_template_id UUID REFERENCES public.lead_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de MESSAGE_STEPS (Funnel)
CREATE TABLE IF NOT EXISTS public.message_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  variation_a TEXT,
  variation_b TEXT,
  is_conversion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabela de LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  company TEXT,
  role TEXT,
  phone TEXT,
  email TEXT,
  lead_model_id UUID REFERENCES public.lead_templates(id) ON DELETE SET NULL,
  custom_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabela de CAMPAIGN_LEADS
CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  step_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  current_step_id UUID REFERENCES public.message_steps(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  deal_value NUMERIC DEFAULT 0,
  close_probability INTEGER,
  reminder_at TIMESTAMPTZ,
  pinned_note TEXT,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

-- 11. Tabela de SCRIPTS
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- opening, follow_up, closing, objection_response
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  objective TEXT,
  audience_id UUID REFERENCES public.audiences(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Tabela de OBJECTIONS
CREATE TABLE IF NOT EXISTS public.objections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  response TEXT NOT NULL,
  category TEXT,
  frequency INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Tabela de INTERACTIONS
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tabela de PLAN_LIMITS (para SubscriptionGuard)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan TEXT PRIMARY KEY,
  max_users INTEGER,
  max_active_campaigns INTEGER,
  max_audiences INTEGER,
  features JSONB DEFAULT '{}'
);

-- Inserir limites padrão se não existirem
INSERT INTO public.plan_limits (plan, max_users, max_active_campaigns, max_audiences, features)
VALUES 
('free', 1, 1, 1, '{"ai_insights": false, "custom_scripts": false}'),
('pro', 3, 5, 10, '{"ai_insights": true, "custom_scripts": true}'),
('scale', -1, -1, -1, '{"ai_insights": true, "custom_scripts": true}')
ON CONFLICT (plan) DO NOTHING;

-- 15. Tabela de USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 16. Habilitar RLS (Opcional para Local, mas boa prática)
-- Para facilitar o teste local do Brayan, vamos manter as tabelas acessíveis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Para simplificar no local dev, você pode rodar esse comando para abrir tudo (NÃO FAZER EM PROD):
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
