INSERT INTO plan_limits (plan, max_users, max_active_campaigns, max_audiences, features)
VALUES ('test', 1, 1, 1, '{"kanban": true, "scripts": true, "lead_templates": true, "basic_metrics": true}')
ON CONFLICT (plan) DO NOTHING;