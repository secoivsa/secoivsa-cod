
CREATE TYPE public.whatsapp_session_status AS ENUM ('disconnected','qr_pending','connecting','connected','error','expired');
CREATE TYPE public.whatsapp_log_level AS ENUM ('info','warning','error','debug');
CREATE TYPE public.whatsapp_queue_direction AS ENUM ('inbound','outbound');
CREATE TYPE public.whatsapp_queue_status AS ENUM ('pending','processing','sent','delivered','failed','blocked');

CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  provider TEXT NOT NULL DEFAULT 'uazapi',
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  status public.whatsapp_session_status NOT NULL DEFAULT 'disconnected',
  qr_base64 TEXT,
  qr_expires_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, instance_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_sessions TO authenticated;
GRANT ALL ON public.whatsapp_sessions TO service_role;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read wa sessions" ON public.whatsapp_sessions FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));
CREATE POLICY "org members write wa sessions" ON public.whatsapp_sessions FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org members update wa sessions" ON public.whatsapp_sessions FOR UPDATE TO authenticated
USING (public.is_org_member(organization_id));
CREATE POLICY "admins delete wa sessions" ON public.whatsapp_sessions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_wa_sessions_updated BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  level public.whatsapp_log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_logs_session ON public.whatsapp_logs(session_id, created_at DESC);
CREATE INDEX idx_wa_logs_org ON public.whatsapp_logs(organization_id, created_at DESC);
GRANT SELECT, INSERT ON public.whatsapp_logs TO authenticated;
GRANT ALL ON public.whatsapp_logs TO service_role;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read wa logs" ON public.whatsapp_logs FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));
CREATE POLICY "org members insert wa logs" ON public.whatsapp_logs FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(organization_id));

CREATE TABLE public.whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  session_id UUID REFERENCES public.whatsapp_sessions(id) ON DELETE SET NULL,
  direction public.whatsapp_queue_direction NOT NULL,
  phone_number TEXT NOT NULL,
  body TEXT,
  media_url TEXT,
  media_mime TEXT,
  media_kind TEXT,
  provider_message_id TEXT,
  status public.whatsapp_queue_status NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_queue_status ON public.whatsapp_queue(status, created_at);
CREATE INDEX idx_wa_queue_phone ON public.whatsapp_queue(phone_number, created_at DESC);
CREATE INDEX idx_wa_queue_org ON public.whatsapp_queue(organization_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_queue TO authenticated;
GRANT ALL ON public.whatsapp_queue TO service_role;
ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read wa queue" ON public.whatsapp_queue FOR SELECT TO authenticated
USING (public.is_org_member(organization_id));
CREATE POLICY "org members write wa queue" ON public.whatsapp_queue FOR INSERT TO authenticated
WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org members update wa queue" ON public.whatsapp_queue FOR UPDATE TO authenticated
USING (public.is_org_member(organization_id));
CREATE TRIGGER trg_wa_queue_updated BEFORE UPDATE ON public.whatsapp_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_rate_limits (
  phone_number TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  count INT NOT NULL DEFAULT 1,
  blocked_until TIMESTAMPTZ,
  PRIMARY KEY (phone_number, window_start)
);
CREATE INDEX idx_wa_rate_window ON public.whatsapp_rate_limits(window_start DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_rate_limits TO authenticated;
GRANT ALL ON public.whatsapp_rate_limits TO service_role;
ALTER TABLE public.whatsapp_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read rate limits" ON public.whatsapp_rate_limits FOR SELECT TO authenticated USING (true);
