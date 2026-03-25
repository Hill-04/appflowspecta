
-- Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Tabela subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
ON public.subscriptions FOR SELECT
USING (user_id = auth.uid());

-- Tabela plan_limits
CREATE TABLE public.plan_limits (
  plan text PRIMARY KEY,
  max_users integer NOT NULL DEFAULT 1,
  max_active_campaigns integer NOT NULL DEFAULT 2,
  max_audiences integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read plan_limits"
ON public.plan_limits FOR SELECT
TO authenticated
USING (true);

-- Trigger updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Dados estáticos
INSERT INTO public.plan_limits (plan, max_users, max_active_campaigns, max_audiences, features) VALUES
('starter', 1, 2, 1, '{"kanban":true,"scripts":true,"lead_templates":true,"basic_metrics":true}'::jsonb),
('growth', 5, 10, -1, '{"kanban":true,"scripts":true,"lead_templates":true,"basic_metrics":true,"cross_campaign_insights":true,"objection_library":true,"custom_funnel":true}'::jsonb),
('scale', 20, -1, -1, '{"kanban":true,"scripts":true,"lead_templates":true,"basic_metrics":true,"cross_campaign_insights":true,"objection_library":true,"custom_funnel":true,"automations":true,"data_export":true,"api_integrations":true,"advanced_copilot":true,"deal_value_edit":true}'::jsonb);
