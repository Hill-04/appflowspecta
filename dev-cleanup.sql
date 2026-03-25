-- CONFIGURAÇÃO DE DESENVOLVIMENTO (EXTREMAMENTE PERMISSIVO)
-- Rode isto no seu SQL Editor

-- 1. Desabilitar RLS em todas as tabelas para facilitar o teste local
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_set_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.objections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_templates DISABLE ROW LEVEL SECURITY;

-- 2. Garantir que o Brayan seja o DONO (Owner) do sistema local
INSERT INTO public.user_roles (user_id, role)
VALUES ('4f0cc0bb-d9c2-4812-8c9f-609017b87b10', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- 3. Forçar status de completo no perfil
UPDATE public.profiles 
SET 
  personal_profile_completed = true, 
  onboarding_completed = true,
  first_name = 'Brayan',
  last_name = 'Guarnieri'
WHERE id = '4f0cc0bb-d9c2-4812-8c9f-609017b87b10';
