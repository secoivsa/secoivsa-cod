
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.interview_status AS ENUM ('programada','confirmada','reprogramada','completada','no_show','cancelada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.interview_mode AS ENUM ('presencial','telefonica','videollamada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.doc_validation_status AS ENUM ('pendiente','valido','incompleto','rechazado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- INTERVIEWS
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  mode public.interview_mode NOT NULL DEFAULT 'presencial',
  location TEXT,
  interviewer_id UUID,
  interviewer_name TEXT,
  status public.interview_status NOT NULL DEFAULT 'programada',
  notes TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interviews_org_date ON public.interviews(organization_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews(candidate_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org read interviews" ON public.interviews FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org write interviews" ON public.interviews FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org update interviews" ON public.interviews FOR UPDATE TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org delete interviews" ON public.interviews FOR DELETE TO authenticated USING (public.is_org_member(organization_id));
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLACKLIST
CREATE TABLE IF NOT EXISTS public.candidate_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  phone TEXT NOT NULL,
  full_name TEXT,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'media',
  added_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON public.candidate_blacklist(phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_blacklist TO authenticated;
GRANT ALL ON public.candidate_blacklist TO service_role;
ALTER TABLE public.candidate_blacklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org read blacklist" ON public.candidate_blacklist FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org write blacklist" ON public.candidate_blacklist FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org delete blacklist" ON public.candidate_blacklist FOR DELETE TO authenticated USING (public.is_org_member(organization_id));

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.hr_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  actor_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_table TEXT,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hr_audit_org_date ON public.hr_audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hr_audit_entity ON public.hr_audit_logs(entity_table, entity_id);
GRANT SELECT, INSERT ON public.hr_audit_logs TO authenticated;
GRANT ALL ON public.hr_audit_logs TO service_role;
ALTER TABLE public.hr_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org read audit" ON public.hr_audit_logs FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org insert audit" ON public.hr_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

-- CANDIDATE_DOCUMENTS extensions
ALTER TABLE public.candidate_documents
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS validation_status public.doc_validation_status NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation_notes TEXT;

-- CANDIDATES extensions
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS risk_score INTEGER,
  ADD COLUMN IF NOT EXISTS documents_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recruiter_id UUID,
  ADD COLUMN IF NOT EXISTS hired_at TIMESTAMPTZ;
