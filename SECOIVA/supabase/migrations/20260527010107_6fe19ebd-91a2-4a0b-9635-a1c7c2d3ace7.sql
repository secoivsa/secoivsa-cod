
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.event_source AS ENUM ('crm','projects','supply','production','quality','safety','finance','hr','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('info','success','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_status AS ENUM ('pendiente','aprobado','rechazado','observado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_kind AS ENUM ('compra','permiso','inspeccion','vacacion','gasto','otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_status AS ENUM ('activa','reconocida','resuelta');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SYSTEM EVENTS
CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  source public.event_source NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entity_table TEXT,
  entity_id UUID,
  project_id UUID,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_org_created ON public.system_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_source ON public.system_events(source, created_at DESC);

GRANT SELECT, INSERT ON public.system_events TO authenticated;
GRANT ALL ON public.system_events TO service_role;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read events" ON public.system_events FOR SELECT TO authenticated USING (organization_id = public.current_org_id());
CREATE POLICY "Org insert events" ON public.system_events FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id());

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  role_target public.app_role,
  type public.notification_type NOT NULL DEFAULT 'info',
  category TEXT,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_role ON public.notifications(organization_id, role_target, read, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own or role notifications" ON public.notifications FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR (role_target IS NOT NULL AND public.has_role(auth.uid(), role_target)) OR (user_id IS NULL AND role_target IS NULL)));
CREATE POLICY "Insert notifications in org" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "Mark own notifications read" ON public.notifications FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id() AND (user_id = auth.uid() OR (role_target IS NOT NULL AND public.has_role(auth.uid(), role_target))));

-- APPROVALS
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  kind public.approval_kind NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  requested_by UUID,
  assigned_to UUID,
  approver_role public.app_role,
  status public.approval_status NOT NULL DEFAULT 'pendiente',
  decision_notes TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approvals_org_status ON public.approvals(organization_id, status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read approvals" ON public.approvals FOR SELECT TO authenticated USING (organization_id = public.current_org_id());
CREATE POLICY "Org create approvals" ON public.approvals FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "Approvers update approvals" ON public.approvals FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id() AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','finanzas','rh','compras','calidad','seguridad']::app_role[]));

CREATE TRIGGER trg_approvals_updated_at BEFORE UPDATE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ALERTS
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  source public.event_source NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'warning',
  status public.alert_status NOT NULL DEFAULT 'activa',
  title TEXT NOT NULL,
  description TEXT,
  entity_table TEXT,
  entity_id UUID,
  project_id UUID,
  link TEXT,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(organization_id, status, severity, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read alerts" ON public.alerts FOR SELECT TO authenticated USING (organization_id = public.current_org_id());
CREATE POLICY "Org insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (organization_id = public.current_org_id());
CREATE POLICY "Supervisors resolve alerts" ON public.alerts FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id() AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad','seguridad','finanzas','rh','compras']::app_role[]));

CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HELPER: emit event + alert
CREATE OR REPLACE FUNCTION public.emit_event(
  _org UUID, _source public.event_source, _type TEXT, _title TEXT,
  _desc TEXT, _entity_table TEXT, _entity_id UUID, _project UUID,
  _severity public.alert_severity, _metadata JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.system_events(organization_id, source, event_type, title, description, entity_table, entity_id, project_id, severity, metadata)
  VALUES (_org, _source, _type, _title, _desc, _entity_table, _entity_id, _project, _severity, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.emit_alert(
  _org UUID, _source public.event_source, _severity public.alert_severity,
  _title TEXT, _desc TEXT, _entity_table TEXT, _entity_id UUID,
  _project UUID, _link TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.alerts(organization_id, source, severity, title, description, entity_table, entity_id, project_id, link)
  VALUES (_org, _source, _severity, _title, _desc, _entity_table, _entity_id, _project, _link)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- AUTOMATION: opportunity approved
CREATE OR REPLACE FUNCTION public.automate_opportunity_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stage = 'aprobado' AND (OLD.stage IS DISTINCT FROM 'aprobado') THEN
    PERFORM public.emit_event(NEW.organization_id, 'crm', 'opportunity.approved',
      'Oportunidad aprobada: ' || NEW.title, 'Valor: ' || NEW.value,
      'opportunities', NEW.id, NEW.project_id, 'info',
      jsonb_build_object('value', NEW.value, 'client_id', NEW.client_id));
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'direccion', 'success', 'crm',
      'Oportunidad aprobada', NEW.title || ' aprobada por $' || NEW.value, '/nexus/crm');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_opp_approved ON public.opportunities;
CREATE TRIGGER trg_auto_opp_approved AFTER UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.automate_opportunity_approved();

-- AUTOMATION: progress entry -> event
CREATE OR REPLACE FUNCTION public.automate_progress_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.emit_event(NEW.organization_id, 'production', 'progress.reported',
    'Avance: ' || NEW.title, NEW.progress_pct || '% reportado',
    'progress_entries', NEW.id, NEW.project_id, 'info',
    jsonb_build_object('pct', NEW.progress_pct, 'hours', NEW.hours));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_progress_event ON public.progress_entries;
CREATE TRIGGER trg_auto_progress_event AFTER INSERT ON public.progress_entries
  FOR EACH ROW EXECUTE FUNCTION public.automate_progress_event();

-- AUTOMATION: material low stock
CREATE OR REPLACE FUNCTION public.automate_material_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.stock <= NEW.min_stock AND NEW.min_stock > 0
     AND (OLD.stock IS NULL OR OLD.stock > NEW.min_stock) THEN
    PERFORM public.emit_alert(NEW.organization_id, 'supply', 'warning',
      'Stock bajo: ' || NEW.name,
      'Stock ' || NEW.stock || ' ' || NEW.unit || ' (mín ' || NEW.min_stock || ')',
      'materials', NEW.id, NULL, '/nexus/supply');
    PERFORM public.emit_event(NEW.organization_id, 'supply', 'material.low_stock',
      'Stock bajo', NEW.name, 'materials', NEW.id, NULL, 'warning',
      jsonb_build_object('stock', NEW.stock, 'min', NEW.min_stock));
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'compras', 'warning', 'supply',
      'Stock bajo', NEW.name || ' bajo mínimo', '/nexus/supply');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_material_low_stock ON public.materials;
CREATE TRIGGER trg_auto_material_low_stock AFTER UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.automate_material_low_stock();

-- AUTOMATION: inspection rejected
CREATE OR REPLACE FUNCTION public.automate_inspection_rejected()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'rechazada' AND (OLD.status IS DISTINCT FROM 'rechazada') THEN
    PERFORM public.emit_alert(NEW.organization_id, 'quality', 'critical',
      'Inspección rechazada: ' || NEW.title,
      COALESCE(NEW.result_notes,''), 'inspections', NEW.id, NEW.project_id, '/nexus/quality');
    PERFORM public.emit_event(NEW.organization_id, 'quality', 'inspection.rejected',
      'Inspección rechazada', NEW.title, 'inspections', NEW.id, NEW.project_id, 'critical', '{}'::jsonb);
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'calidad', 'critical', 'quality',
      'Inspección rechazada', NEW.title, '/nexus/quality');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_inspection_rejected ON public.inspections;
CREATE TRIGGER trg_auto_inspection_rejected AFTER UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.automate_inspection_rejected();

-- AUTOMATION: incident high severity
CREATE OR REPLACE FUNCTION public.automate_incident_alert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _sev public.alert_severity;
BEGIN
  _sev := CASE NEW.severity::text
    WHEN 'fatal' THEN 'critical'::public.alert_severity
    WHEN 'mayor' THEN 'critical'::public.alert_severity
    WHEN 'menor' THEN 'warning'::public.alert_severity
    ELSE 'info'::public.alert_severity
  END;
  PERFORM public.emit_alert(NEW.organization_id, 'safety', _sev,
    'Incidente: ' || NEW.title, NEW.description, 'incidents', NEW.id, NEW.project_id, '/nexus/safety');
  PERFORM public.emit_event(NEW.organization_id, 'safety', 'incident.reported',
    'Incidente reportado', NEW.title, 'incidents', NEW.id, NEW.project_id, _sev,
    jsonb_build_object('severity', NEW.severity));
  IF _sev = 'critical' THEN
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'direccion', 'critical', 'safety', 'Incidente crítico', NEW.title, '/nexus/safety'),
           (NEW.organization_id, 'seguridad', 'critical', 'safety', 'Incidente crítico', NEW.title, '/nexus/safety');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_incident ON public.incidents;
CREATE TRIGGER trg_auto_incident AFTER INSERT ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.automate_incident_alert();

-- AUTOMATION: employee document expiring
CREATE OR REPLACE FUNCTION public.automate_employee_doc_expiring()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= (CURRENT_DATE + INTERVAL '15 days') THEN
    PERFORM public.emit_alert(NEW.organization_id, 'hr', 'warning',
      'Documento por vencer: ' || NEW.name,
      'Vence ' || NEW.expires_at::text, 'employee_documents', NEW.id, NULL, '/nexus/hr');
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'rh', 'warning', 'hr',
      'Documento por vencer', NEW.name || ' vence ' || NEW.expires_at::text, '/nexus/hr');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_emp_doc_exp ON public.employee_documents;
CREATE TRIGGER trg_auto_emp_doc_exp AFTER INSERT OR UPDATE ON public.employee_documents
  FOR EACH ROW EXECUTE FUNCTION public.automate_employee_doc_expiring();

-- AUTOMATION: work permit expiring (on update of valid_until)
CREATE OR REPLACE FUNCTION public.automate_permit_expiring()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.valid_until IS NOT NULL AND NEW.valid_until <= (now() + INTERVAL '48 hours')
     AND NEW.status::text NOT IN ('cerrado','cancelado','vencido') THEN
    PERFORM public.emit_alert(NEW.organization_id, 'safety', 'warning',
      'Permiso próximo a vencer: ' || NEW.folio,
      'Vence ' || NEW.valid_until::text, 'work_permits', NEW.id, NEW.project_id, '/nexus/safety');
    INSERT INTO public.notifications(organization_id, role_target, type, category, title, message, link)
    VALUES (NEW.organization_id, 'seguridad', 'warning', 'safety',
      'Permiso por vencer', NEW.folio || ' vence pronto', '/nexus/safety');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auto_permit_exp ON public.work_permits;
CREATE TRIGGER trg_auto_permit_exp AFTER INSERT OR UPDATE ON public.work_permits
  FOR EACH ROW EXECUTE FUNCTION public.automate_permit_expiring();
