
-- Department enum
DO $$ BEGIN
  CREATE TYPE public.department AS ENUM (
    'direccion','asesoria','subgerencia','operaciones','produccion',
    'calidad','seguridad','finanzas','comercial','rh','compras','general'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.email_direction AS ENUM ('inbound','outbound','internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.email_status AS ENUM ('nuevo','asignado','en_proceso','respondido','cerrado','archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Central email messages (single inbox: contacto@secoivsa.com)
CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  thread_id UUID,
  external_message_id TEXT,
  direction public.email_direction NOT NULL DEFAULT 'inbound',
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL DEFAULT ARRAY['contacto@secoivsa.com'],
  cc_emails TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  tags TEXT[] DEFAULT '{}',
  detected_department public.department,
  detected_keywords TEXT[] DEFAULT '{}',
  routing_confidence NUMERIC DEFAULT 0,
  routing_rule_id UUID,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  module_link TEXT,
  status public.email_status NOT NULL DEFAULT 'nuevo',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_department public.department,
  has_attachments BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_messages_org ON public.email_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_dept ON public.email_messages(detected_department);
CREATE INDEX IF NOT EXISTS idx_email_messages_status ON public.email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_messages_project ON public.email_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_received ON public.email_messages(received_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_messages TO authenticated;
GRANT ALL ON public.email_messages TO service_role;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read emails" ON public.email_messages FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY "org members insert emails" ON public.email_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "org members update emails" ON public.email_messages FOR UPDATE TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY "admins delete emails" ON public.email_messages FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','direccion']::app_role[]));

-- Routing rules (subject/tag/keyword → department)
CREATE TABLE IF NOT EXISTS public.email_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  name TEXT NOT NULL,
  description TEXT,
  match_type TEXT NOT NULL DEFAULT 'keyword', -- keyword | tag | subject_prefix | sender_domain | regex
  pattern TEXT NOT NULL,
  target_department public.department NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  auto_assign_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notify BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_org ON public.email_routing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON public.email_routing_rules(active, priority);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_routing_rules TO authenticated;
GRANT ALL ON public.email_routing_rules TO service_role;
ALTER TABLE public.email_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read rules" ON public.email_routing_rules FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY "admins manage rules" ON public.email_routing_rules FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','direccion']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','direccion']::app_role[]));

-- Department assignments (which users handle which department)
CREATE TABLE IF NOT EXISTS public.department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department NOT NULL,
  is_lead BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, department)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_members TO authenticated;
GRANT ALL ON public.department_members TO service_role;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read dept" ON public.department_members FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY "admins manage dept" ON public.department_members FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','direccion']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','direccion']::app_role[]));

-- Email events log (workflow audit)
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  email_id UUID NOT NULL REFERENCES public.email_messages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- received | routed | assigned | status_changed | replied | linked_project
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_email ON public.email_events(email_id, created_at DESC);

GRANT SELECT, INSERT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read events" ON public.email_events FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id));
CREATE POLICY "org members insert events" ON public.email_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(organization_id));

-- Triggers
DROP TRIGGER IF EXISTS trg_email_updated ON public.email_messages;
CREATE TRIGGER trg_email_updated BEFORE UPDATE ON public.email_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_rules_updated ON public.email_routing_rules;
CREATE TRIGGER trg_rules_updated BEFORE UPDATE ON public.email_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default routing rules
INSERT INTO public.email_routing_rules (name, match_type, pattern, target_department, priority) VALUES
  ('Tag RH','subject_prefix','[RH]','rh',10),
  ('Tag Cotización','subject_prefix','[COTIZACION]','comercial',10),
  ('Tag Compra','subject_prefix','[COMPRA]','compras',10),
  ('Tag Producción','subject_prefix','[PRODUCCION]','produccion',10),
  ('Tag Calidad','subject_prefix','[CALIDAD]','calidad',10),
  ('Tag Seguridad','subject_prefix','[SEGURIDAD]','seguridad',10),
  ('Tag Finanzas','subject_prefix','[FINANZAS]','finanzas',10),
  ('Tag Operaciones','subject_prefix','[OPERACIONES]','operaciones',10),
  ('Keyword cv/curriculum','keyword','curriculum|cv|vacante|empleo|postul','rh',50),
  ('Keyword cotización','keyword','cotizacion|cotización|presupuesto|propuesta','comercial',50),
  ('Keyword factura','keyword','factura|pago|cxc|cxp|cobranza','finanzas',50),
  ('Keyword orden compra','keyword','orden de compra|requisicion|requisición|proveedor','compras',50),
  ('Keyword incidente','keyword','incidente|accidente|emergencia|riesgo','seguridad',50),
  ('Keyword no conformidad','keyword','no conformidad|inspeccion|inspección|calidad','calidad',50),
  ('Keyword avance obra','keyword','avance|obra|montaje|construccion|construcción','produccion',50)
ON CONFLICT DO NOTHING;
