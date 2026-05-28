ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS seniority text,
  ADD COLUMN IF NOT EXISTS experience_years int,
  ADD COLUMN IF NOT EXISTS ai_score int,
  ADD COLUMN IF NOT EXISTS urgency text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_tags text[] DEFAULT '{}'::text[];

ALTER TABLE public.bot_sessions
  ADD COLUMN IF NOT EXISTS turn_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;