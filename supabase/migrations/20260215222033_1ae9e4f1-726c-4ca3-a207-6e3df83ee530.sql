-- Update starter: add custom_funnel
UPDATE plan_limits 
SET features = features::jsonb || '{"custom_funnel": true}'::jsonb 
WHERE plan = 'starter';

-- Update test: same as starter
UPDATE plan_limits 
SET features = features::jsonb || '{"custom_funnel": true}'::jsonb 
WHERE plan = 'test';

-- Update growth: add advanced_copilot, deal_value_edit; set max_audiences to 5
UPDATE plan_limits 
SET features = features::jsonb || '{"advanced_copilot": true, "deal_value_edit": true}'::jsonb,
    max_audiences = 5
WHERE plan = 'growth';