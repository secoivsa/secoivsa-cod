
CREATE TYPE public.opportunity_stage AS ENUM ('prospecto','contactado','cotizacion','negociacion','aprobado','perdido');
CREATE TYPE public.quote_status AS ENUM ('borrador','enviada','aprobada','rechazada','vencida');
CREATE TYPE public.activity_type AS ENUM ('llamada','correo','reunion','nota','tarea');

CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID,
  project_id UUID,
  title TEXT NOT NULL,
  stage public.opportunity_stage NOT NULL DEFAULT 'prospecto',
  value NUMERIC NOT NULL DEFAULT 0,
  probability INT NOT NULL DEFAULT 20,
  expected_close_date DATE,
  owner_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read opportunities" ON public.opportunities FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Comercial write opportunities" ON public.opportunities FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]));
CREATE TRIGGER set_opportunities_updated BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_opportunities_org ON public.opportunities(organization_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);

CREATE SEQUENCE IF NOT EXISTS public.quote_folio_seq START 1000;

CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  folio TEXT NOT NULL UNIQUE,
  client_id UUID,
  opportunity_id UUID,
  status public.quote_status NOT NULL DEFAULT 'borrador',
  currency TEXT NOT NULL DEFAULT 'MXN',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  title TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read quotes" ON public.quotes FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Comercial write quotes" ON public.quotes FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]));
CREATE TRIGGER set_quotes_updated BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.assign_quote_folio()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'COT-' || to_char(now(),'YY') || '-' || lpad(nextval('public.quote_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assign_quote_folio_trg BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.assign_quote_folio();

CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of org quotes" ON public.quote_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.organization_id = current_org_id()));
CREATE POLICY "Comercial write quote items" ON public.quote_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::app_role[]));
CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id);

CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  client_id UUID,
  opportunity_id UUID,
  project_id UUID,
  type public.activity_type NOT NULL DEFAULT 'nota',
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read activities" ON public.activities FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Org members write activities" ON public.activities FOR ALL TO authenticated
  USING (organization_id = current_org_id())
  WITH CHECK (organization_id = current_org_id());
CREATE TRIGGER set_activities_updated BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_milestones TO authenticated;
GRANT ALL ON public.project_milestones TO service_role;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read milestones of org projects" ON public.project_milestones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id()));
CREATE POLICY "Ops write milestones" ON public.project_milestones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]));
CREATE TRIGGER set_project_milestones_updated BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_team TO authenticated;
GRANT ALL ON public.project_team TO service_role;
ALTER TABLE public.project_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read team of org projects" ON public.project_team FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id()));
CREATE POLICY "Ops write project team" ON public.project_team FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]));

CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  file_url TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read docs of org projects" ON public.project_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id()));
CREATE POLICY "Org members write project docs" ON public.project_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.organization_id = current_org_id()));

CREATE OR REPLACE FUNCTION public.opportunity_to_project()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
DECLARE
  _proj_id UUID;
BEGIN
  IF NEW.stage = 'aprobado' AND (OLD.stage IS DISTINCT FROM 'aprobado') AND NEW.project_id IS NULL THEN
    INSERT INTO public.projects (organization_id, name, client_id, status, budget, project_manager_id, created_by)
    VALUES (NEW.organization_id, NEW.title, NEW.client_id, 'planeacion', NEW.value, NEW.owner_id, NEW.created_by)
    RETURNING id INTO _proj_id;
    NEW.project_id := _proj_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER opp_to_project_trg BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.opportunity_to_project();
