
-- ============ ENUMS ============
CREATE TYPE public.inspection_status AS ENUM ('pendiente','en_proceso','liberada','rechazada');
CREATE TYPE public.nc_severity AS ENUM ('menor','mayor','critica');
CREATE TYPE public.nc_status AS ENUM ('abierta','en_accion','verificacion','cerrada');
CREATE TYPE public.action_status AS ENUM ('pendiente','en_curso','completada','verificada');
CREATE TYPE public.permit_type AS ENUM ('altura','caliente','electrico','excavacion','espacio_confinado','izaje','quimicos','general');
CREATE TYPE public.permit_status AS ENUM ('borrador','en_revision','aprobado','rechazado','cerrado');
CREATE TYPE public.incident_severity AS ENUM ('casi_accidente','leve','moderado','grave','fatal');
CREATE TYPE public.incident_status AS ENUM ('reportado','investigacion','accion','cerrado');

-- ============ INSPECTIONS ============
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  work_front_id UUID,
  folio TEXT,
  title TEXT NOT NULL,
  description TEXT,
  inspection_type TEXT,
  status public.inspection_status NOT NULL DEFAULT 'pendiente',
  scheduled_date DATE,
  performed_date DATE,
  inspector_id UUID,
  result_notes TEXT,
  score NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT ALL ON public.inspections TO service_role;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read inspections" ON public.inspections FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Quality write inspections" ON public.inspections FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]));
CREATE TRIGGER trg_inspections_updated BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL,
  order_idx INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  passed BOOLEAN,
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inspection_items TO authenticated;
GRANT ALL ON public.inspection_items TO service_role;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of org inspections" ON public.inspection_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.organization_id = current_org_id()));
CREATE POLICY "Quality write inspection items" ON public.inspection_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.inspections i WHERE i.id = inspection_id AND i.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]));

-- ============ NON CONFORMITIES ============
CREATE TABLE public.non_conformities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  inspection_id UUID,
  folio TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity public.nc_severity NOT NULL DEFAULT 'menor',
  status public.nc_status NOT NULL DEFAULT 'abierta',
  detected_at DATE NOT NULL DEFAULT CURRENT_DATE,
  detected_by UUID,
  responsible_id UUID,
  root_cause TEXT,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.non_conformities TO authenticated;
GRANT ALL ON public.non_conformities TO service_role;
ALTER TABLE public.non_conformities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read NCs" ON public.non_conformities FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Quality write NCs" ON public.non_conformities FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]));
CREATE TRIGGER trg_ncs_updated BEFORE UPDATE ON public.non_conformities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  non_conformity_id UUID NOT NULL,
  description TEXT NOT NULL,
  responsible_id UUID,
  due_date DATE,
  status public.action_status NOT NULL DEFAULT 'pendiente',
  completed_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corrective_actions TO authenticated;
GRANT ALL ON public.corrective_actions TO service_role;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read actions of org NCs" ON public.corrective_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.non_conformities n WHERE n.id = non_conformity_id AND n.organization_id = current_org_id()));
CREATE POLICY "Quality write actions" ON public.corrective_actions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.non_conformities n WHERE n.id = non_conformity_id AND n.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.non_conformities n WHERE n.id = non_conformity_id AND n.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]));
CREATE TRIGGER trg_actions_updated BEFORE UPDATE ON public.corrective_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ QUALITY DOCUMENTS ============
CREATE TABLE public.quality_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  name TEXT NOT NULL,
  category TEXT,
  version TEXT DEFAULT 'v1',
  file_url TEXT,
  file_path TEXT,
  notes TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quality_documents TO authenticated;
GRANT ALL ON public.quality_documents TO service_role;
ALTER TABLE public.quality_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read q-docs" ON public.quality_documents FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Quality write q-docs" ON public.quality_documents FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','calidad']::app_role[]));
CREATE TRIGGER trg_qdocs_updated BEFORE UPDATE ON public.quality_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SAFETY: WORK PERMITS ============
CREATE TABLE public.work_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  work_front_id UUID,
  folio TEXT,
  permit_type public.permit_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status public.permit_status NOT NULL DEFAULT 'borrador',
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  hazards TEXT,
  controls TEXT,
  ppe TEXT,
  requested_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_permits TO authenticated;
GRANT ALL ON public.work_permits TO service_role;
ALTER TABLE public.work_permits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read permits" ON public.work_permits FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Safety write permits" ON public.work_permits FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion']::app_role[]));
CREATE TRIGGER trg_permits_updated BEFORE UPDATE ON public.work_permits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SAFETY: INCIDENTS ============
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  work_front_id UUID,
  folio TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity public.incident_severity NOT NULL DEFAULT 'casi_accidente',
  status public.incident_status NOT NULL DEFAULT 'reportado',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT,
  injured_person TEXT,
  reported_by UUID,
  responsible_id UUID,
  root_cause TEXT,
  actions_taken TEXT,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read incidents" ON public.incidents FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Safety write incidents" ON public.incidents FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion']::app_role[]));
CREATE TRIGGER trg_incidents_updated BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SAFETY VALIDATIONS ============
CREATE TABLE public.safety_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  work_front_id UUID,
  progress_entry_id UUID,
  title TEXT NOT NULL,
  notes TEXT,
  validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_validations TO authenticated;
GRANT ALL ON public.safety_validations TO service_role;
ALTER TABLE public.safety_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read validations" ON public.safety_validations FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Safety write validations" ON public.safety_validations FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion','calidad']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor','seguridad','produccion','calidad']::app_role[]));
CREATE TRIGGER trg_validations_updated BEFORE UPDATE ON public.safety_validations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FOLIO SEQUENCES + TRIGGERS ============
CREATE SEQUENCE IF NOT EXISTS public.inspection_folio_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.nc_folio_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.permit_folio_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.incident_folio_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_inspection_folio() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'INS-' || to_char(now(),'YY') || '-' || lpad(nextval('public.inspection_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_inspection_folio BEFORE INSERT ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.assign_inspection_folio();

CREATE OR REPLACE FUNCTION public.assign_nc_folio() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'NC-' || to_char(now(),'YY') || '-' || lpad(nextval('public.nc_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_nc_folio BEFORE INSERT ON public.non_conformities FOR EACH ROW EXECUTE FUNCTION public.assign_nc_folio();

CREATE OR REPLACE FUNCTION public.assign_permit_folio() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'PT-' || to_char(now(),'YY') || '-' || lpad(nextval('public.permit_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_permit_folio BEFORE INSERT ON public.work_permits FOR EACH ROW EXECUTE FUNCTION public.assign_permit_folio();

CREATE OR REPLACE FUNCTION public.assign_incident_folio() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'INC-' || to_char(now(),'YY') || '-' || lpad(nextval('public.incident_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_incident_folio BEFORE INSERT ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.assign_incident_folio();

-- ============ INDEXES ============
CREATE INDEX idx_inspections_org ON public.inspections(organization_id);
CREATE INDEX idx_inspections_project ON public.inspections(project_id);
CREATE INDEX idx_ncs_org ON public.non_conformities(organization_id);
CREATE INDEX idx_ncs_project ON public.non_conformities(project_id);
CREATE INDEX idx_permits_org ON public.work_permits(organization_id);
CREATE INDEX idx_permits_project ON public.work_permits(project_id);
CREATE INDEX idx_incidents_org ON public.incidents(organization_id);
CREATE INDEX idx_incidents_project ON public.incidents(project_id);
