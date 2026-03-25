
-- Prospecting goals table
CREATE TABLE public.prospecting_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  target integer NOT NULL,
  metric text NOT NULL DEFAULT 'custom',
  color text DEFAULT '#6366f1',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prospecting_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prospecting_goals"
  ON public.prospecting_goals FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Prospecting progress table
CREATE TABLE public.prospecting_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  goal_id uuid REFERENCES public.prospecting_goals ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT current_date,
  current_value integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, goal_id, date)
);

ALTER TABLE public.prospecting_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own prospecting_progress"
  ON public.prospecting_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
