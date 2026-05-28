ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS availability text;

CREATE INDEX IF NOT EXISTS idx_candidates_category ON public.candidates(category);
CREATE INDEX IF NOT EXISTS idx_candidates_urgency ON public.candidates(urgency);