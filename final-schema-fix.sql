-- AJUSTE DE SCHEMA PARA O SCRIPT FINAL
-- Cole e rode no Supabase SQL Editor antes de rodar o node flowspecta-config-FINAL.js

-- 1. Ajustar Objeções
ALTER TABLE public.objections RENAME COLUMN title TO objection;

-- 2. Ajustar Scripts
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS "trigger" TEXT;
ALTER TABLE public.scripts ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- 3. Ajustar Metas
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS phase INTEGER;
