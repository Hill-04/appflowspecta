
-- Campo de arquivamento em campaign_leads
ALTER TABLE campaign_leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz default null,
  ADD COLUMN IF NOT EXISTS archive_reason text default null;

-- Configurações de arquivamento automático por usuário
CREATE TABLE IF NOT EXISTS archive_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  archive_converted text default 'first_of_month',
  archive_converted_custom_day integer default null,
  archive_inactive_days integer default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE archive_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own archive settings" ON archive_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
