-- SEGUNDO AJUSTE DE SCHEMA (COLUNAS FALTANTES)
-- Cole e rode no Supabase SQL Editor para liberar o script final

-- 1. Adicionar descrição na campanha
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Adicionar campaign_id nos scripts
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id);

-- 3. Adicionar campaign_id nas objeções
ALTER TABLE public.objections ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id);
