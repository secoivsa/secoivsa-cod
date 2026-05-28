
-- Enums
CREATE TYPE public.candidate_status AS ENUM ('nuevo','en_revision','entrevista','aceptado','rechazado','contratado','descartado');
CREATE TYPE public.candidate_source AS ENUM ('web','whatsapp','referido','manual');
CREATE TYPE public.candidate_msg_direction AS ENUM ('in','out');

-- Candidates
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  full_name TEXT,
  phone TEXT,
  email TEXT,
  position TEXT,
  source public.candidate_source NOT NULL DEFAULT 'web',
  status public.candidate_status NOT NULL DEFAULT 'nuevo',
  assigned_to UUID,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidates_phone ON public.candidates(phone);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_candidates_org ON public.candidates(organization_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read candidates" ON public.candidates FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org members write candidates" ON public.candidates FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org members update candidates" ON public.candidates FOR UPDATE TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org members delete candidates" ON public.candidates FOR DELETE TO authenticated USING (public.is_org_member(organization_id));

CREATE TRIGGER trg_candidates_updated_at BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.candidate_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  direction public.candidate_msg_direction NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  body TEXT,
  media_url TEXT,
  provider_message_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidate_messages_candidate ON public.candidate_messages(candidate_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_messages TO authenticated;
GRANT ALL ON public.candidate_messages TO service_role;
ALTER TABLE public.candidate_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read msgs" ON public.candidate_messages FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org members insert msgs" ON public.candidate_messages FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

-- Documents
CREATE TABLE public.candidate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidate_docs_candidate ON public.candidate_documents(candidate_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_documents TO authenticated;
GRANT ALL ON public.candidate_documents TO service_role;
ALTER TABLE public.candidate_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read docs" ON public.candidate_documents FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org members write docs" ON public.candidate_documents FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org members delete docs" ON public.candidate_documents FOR DELETE TO authenticated USING (public.is_org_member(organization_id));

-- Timeline
CREATE TABLE public.candidate_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_candidate_timeline_candidate ON public.candidate_timeline(candidate_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_timeline TO authenticated;
GRANT ALL ON public.candidate_timeline TO service_role;
ALTER TABLE public.candidate_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read timeline" ON public.candidate_timeline FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org members write timeline" ON public.candidate_timeline FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));

-- Bot sessions (state machine por número)
CREATE TABLE public.bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'greeting',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bot_sessions_phone ON public.bot_sessions(phone);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_sessions TO authenticated;
GRANT ALL ON public.bot_sessions TO service_role;
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read bot sessions" ON public.bot_sessions FOR SELECT TO authenticated USING (true);

CREATE TRIGGER trg_bot_sessions_updated_at BEFORE UPDATE ON public.bot_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket privado para documentos de candidatos
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-docs','candidate-docs',false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "auth read candidate-docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidate-docs');
CREATE POLICY "auth upload candidate-docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'candidate-docs');
CREATE POLICY "anon upload candidate-docs" ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'candidate-docs');
