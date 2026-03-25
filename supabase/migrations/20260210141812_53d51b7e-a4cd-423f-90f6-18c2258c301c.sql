
-- ========== TABLES FIRST ==========

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Audiences
CREATE TABLE public.audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  segment text DEFAULT '',
  criteria text[] DEFAULT '{}',
  size int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own audiences" ON public.audiences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Scripts
CREATE TABLE public.scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'opening',
  content text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own scripts" ON public.scripts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Objections
CREATE TABLE public.objections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  response text DEFAULT '',
  category text DEFAULT '',
  frequency int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.objections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own objections" ON public.objections FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  audience_id uuid REFERENCES public.audiences(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.campaigns FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text DEFAULT '',
  company text DEFAULT '',
  role text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  step_index int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  last_interaction timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leads" ON public.leads FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Message Steps
CREATE TABLE public.message_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  step_name text NOT NULL DEFAULT '',
  step_order int NOT NULL DEFAULT 1,
  variation_a text DEFAULT '',
  variation_b text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.message_steps ENABLE ROW LEVEL SECURITY;

-- Interactions
CREATE TABLE public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ========== HELPER FUNCTIONS (tables exist now) ==========

CREATE OR REPLACE FUNCTION public.is_owner_of_campaign(_campaign_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = _campaign_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_owner_of_lead(_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = _lead_id AND user_id = auth.uid()
  )
$$;

-- ========== RLS for message_steps & interactions ==========

CREATE POLICY "Users select own message_steps" ON public.message_steps
  FOR SELECT USING (public.is_owner_of_campaign(campaign_id));
CREATE POLICY "Users insert own message_steps" ON public.message_steps
  FOR INSERT WITH CHECK (public.is_owner_of_campaign(campaign_id));
CREATE POLICY "Users update own message_steps" ON public.message_steps
  FOR UPDATE USING (public.is_owner_of_campaign(campaign_id));
CREATE POLICY "Users delete own message_steps" ON public.message_steps
  FOR DELETE USING (public.is_owner_of_campaign(campaign_id));

CREATE POLICY "Users select own interactions" ON public.interactions
  FOR SELECT USING (public.is_owner_of_lead(lead_id));
CREATE POLICY "Users insert own interactions" ON public.interactions
  FOR INSERT WITH CHECK (public.is_owner_of_lead(lead_id));
CREATE POLICY "Users update own interactions" ON public.interactions
  FOR UPDATE USING (public.is_owner_of_lead(lead_id));
CREATE POLICY "Users delete own interactions" ON public.interactions
  FOR DELETE USING (public.is_owner_of_lead(lead_id));

-- ========== SEED TRIGGER ==========

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := NEW.id;
  _audience_id uuid;
  _campaign_id uuid;
BEGIN
  INSERT INTO public.profiles (id) VALUES (_user_id);

  _audience_id := gen_random_uuid();
  INSERT INTO public.audiences (id, user_id, name, description, segment, criteria, size)
  VALUES (_audience_id, _user_id, 'CEOs de SaaS B2B', 'CEOs e fundadores de empresas SaaS com 10-50 funcionários', 'Tecnologia', ARRAY['SaaS B2B', '10-50 funcionários', 'Série A'], 245);

  _campaign_id := gen_random_uuid();
  INSERT INTO public.campaigns (id, user_id, name, audience_id, status)
  VALUES (_campaign_id, _user_id, 'Prospecção CEOs SaaS Q1', _audience_id, 'active');

  INSERT INTO public.message_steps (campaign_id, step_name, step_order, variation_a, variation_b) VALUES
  (_campaign_id, 'Primeira abordagem', 1, 'Oi {nome}, vi que você lidera a {empresa}. Queria trocar uma ideia sobre como empresas do seu segmento estão resolvendo {dor}. Faz sentido?', 'Oi {nome}, sou especialista em ajudar SaaS como a {empresa} a escalar vendas. Posso te mostrar como em 5 min?'),
  (_campaign_id, 'Follow-up', 2, 'Oi {nome}, voltando aqui. Vi que {empresa} está crescendo e preparei um material rápido. Posso compartilhar?', ''),
  (_campaign_id, 'Última tentativa', 3, '{nome}, última mensagem. Caso mude de ideia, estou por aqui.', '');

  INSERT INTO public.leads (user_id, campaign_id, name, company, role, phone, email, contact, step_index, status) VALUES
  (_user_id, _campaign_id, 'Ricardo Mendes', 'TechFlow', 'CEO', '(11) 99999-0001', 'ricardo@techflow.com', '(11) 99999-0001', 0, 'pending'),
  (_user_id, _campaign_id, 'Ana Souza', 'DataPro', 'CTO', '(11) 99999-0002', 'ana@datapro.com', '(11) 99999-0002', 1, 'contacted'),
  (_user_id, _campaign_id, 'Carlos Lima', 'SalesHub', 'Diretor Comercial', '(11) 99999-0003', 'carlos@saleshub.com', '(11) 99999-0003', 2, 'interested'),
  (_user_id, _campaign_id, 'Mariana Costa', 'GrowthLab', 'CEO', '(11) 99999-0004', 'mariana@growthlab.com', '(11) 99999-0004', 1, 'info_requested'),
  (_user_id, _campaign_id, 'Pedro Alves', 'CloudBase', 'VP Vendas', '(11) 99999-0005', 'pedro@cloudbase.com', '(11) 99999-0005', 0, 'pending');

  INSERT INTO public.scripts (user_id, name, type, content, tags) VALUES
  (_user_id, 'Abertura consultiva', 'opening', 'Oi {nome}, vi que você lidera {empresa} e queria trocar uma ideia sobre como outras empresas do seu segmento estão resolvendo {dor}. Faz sentido pra você?', ARRAY['consultivo', 'abordagem suave']),
  (_user_id, 'Follow-up valor', 'follow_up', 'Oi {nome}, voltando aqui. Preparei um material rápido sobre como {benefício}. Posso compartilhar com você?', ARRAY['follow-up', 'valor']),
  (_user_id, 'Abertura direta', 'opening', 'Oi {nome}, sou {seu_nome} da {sua_empresa}. Ajudamos empresas como a {empresa} a {benefício principal}. Posso te mostrar como em 5 minutos?', ARRAY['direto', 'objetivo']);

  INSERT INTO public.objections (user_id, title, response, category, frequency) VALUES
  (_user_id, 'Está caro para nós no momento', 'Entendo perfeitamente. O retorno médio é de 3x em 90 dias. Posso te mostrar como calculamos isso?', 'Preço', 42),
  (_user_id, 'Já temos uma solução', 'Ótimo que já investem nisso! O diferencial que costuma pesar é {diferencial}. Faz sentido explorar?', 'Concorrência', 35),
  (_user_id, 'Não tenho tempo agora', 'Total, respeito seu tempo. Posso te mandar um resumo de 2 minutos por aqui mesmo?', 'Tempo', 28);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
