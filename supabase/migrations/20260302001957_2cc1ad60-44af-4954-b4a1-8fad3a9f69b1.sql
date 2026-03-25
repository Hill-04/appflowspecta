ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS close_probability integer default null;
ALTER TABLE campaign_leads ALTER COLUMN deal_value SET DEFAULT null;