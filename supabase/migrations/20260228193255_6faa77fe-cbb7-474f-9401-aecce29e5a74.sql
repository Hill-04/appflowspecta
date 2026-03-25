
UPDATE public.plan_limits
SET features = jsonb_set(
  jsonb_set(features, '{objections}', 'false'),
  '{copilot}', 'false'
)
WHERE plan = 'starter';

UPDATE public.plan_limits
SET features = jsonb_set(
  jsonb_set(features, '{objections}', 'true'),
  '{copilot}', 'true'
)
WHERE plan = 'growth';

UPDATE public.plan_limits
SET features = jsonb_set(
  jsonb_set(features, '{objections}', 'true'),
  '{copilot}', 'true'
)
WHERE plan = 'scale';
