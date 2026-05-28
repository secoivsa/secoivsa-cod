-- ============ FINANCE ENUMS ============
CREATE TYPE public.expense_category AS ENUM (
  'materiales','mano_obra','equipo','subcontrato','servicios','transporte','administrativo','seguridad','calidad','otros'
);
CREATE TYPE public.expense_status AS ENUM ('borrador','aprobado','pagado','cancelado');
CREATE TYPE public.cash_movement_type AS ENUM ('ingreso','egreso');

-- ============ HR ENUMS ============
CREATE TYPE public.attendance_status AS ENUM ('presente','retardo','falta','incapacidad','vacaciones');
CREATE TYPE public.document_kind AS ENUM ('ine','contrato','dc3','certificacion','curp_doc','rfc_doc','nss_doc','poliza','otro');
CREATE TYPE public.vacation_status AS ENUM ('solicitada','aprobada','rechazada','disfrutada');

-- ============ BUDGETS ============
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  notes TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read budgets" ON public.budgets FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Finance write budgets" ON public.budgets FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]));
CREATE TRIGGER trg_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ BUDGET LINES ============
CREATE TABLE public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL,
  category public.expense_category NOT NULL DEFAULT 'otros',
  description TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_lines TO authenticated;
GRANT ALL ON public.budget_lines TO service_role;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read lines of org budgets" ON public.budget_lines FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_lines.budget_id AND b.organization_id = current_org_id()));
CREATE POLICY "Finance write budget lines" ON public.budget_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_lines.budget_id AND b.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]))
  WITH CHECK (EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_lines.budget_id AND b.organization_id = current_org_id())
         AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]));

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  category public.expense_category NOT NULL DEFAULT 'otros',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.expense_status NOT NULL DEFAULT 'borrador',
  vendor TEXT,
  invoice_number TEXT,
  purchase_order_id UUID,
  notes TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read expenses" ON public.expenses FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Finance write expenses" ON public.expenses FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role,'compras'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role,'compras'::app_role]));
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CASH MOVEMENTS ============
CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID,
  movement_type public.cash_movement_type NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read cash" ON public.cash_movements FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "Finance write cash" ON public.cash_movements FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'finanzas'::app_role]));

-- ============ ATTENDANCE ============
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  project_id UUID,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  hours NUMERIC NOT NULL DEFAULT 0,
  status public.attendance_status NOT NULL DEFAULT 'presente',
  notes TEXT,
  validated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read attendance" ON public.attendance FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "HR/Ops write attendance" ON public.attendance FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role,'produccion'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role,'produccion'::app_role]));
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EMPLOYEE DOCUMENTS ============
CREATE TABLE public.employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  kind public.document_kind NOT NULL DEFAULT 'otro',
  name TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT,
  expires_at DATE,
  uploaded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO authenticated;
GRANT ALL ON public.employee_documents TO service_role;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HR read employee docs" ON public.employee_documents FOR SELECT TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role]));
CREATE POLICY "HR write employee docs" ON public.employee_documents FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]));
CREATE TRIGGER trg_emp_docs_updated BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ EMPLOYEE ASSIGNMENTS ============
CREATE TABLE public.employee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  project_id UUID NOT NULL,
  role_label TEXT,
  start_date DATE,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_assignments TO authenticated;
GRANT ALL ON public.employee_assignments TO service_role;
ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read assignments" ON public.employee_assignments FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "HR/Ops write assignments" ON public.employee_assignments FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role,'produccion'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role,'produccion'::app_role]));

-- ============ VACATION REQUESTS ============
CREATE TABLE public.vacation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL DEFAULT 0,
  status public.vacation_status NOT NULL DEFAULT 'solicitada',
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacation_requests TO authenticated;
GRANT ALL ON public.vacation_requests TO service_role;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read vacations" ON public.vacation_requests FOR SELECT TO authenticated
  USING (organization_id = current_org_id());
CREATE POLICY "HR write vacations" ON public.vacation_requests FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]));
CREATE TRIGGER trg_vacations_updated BEFORE UPDATE ON public.vacation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE: employee-docs (private) ============
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-docs','employee-docs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "HR read employee files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-docs' AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role,'supervisor'::app_role]));
CREATE POLICY "HR upload employee files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-docs' AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]));
CREATE POLICY "HR update employee files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-docs' AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]));
CREATE POLICY "HR delete employee files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-docs' AND has_any_role(auth.uid(), ARRAY['direccion'::app_role,'admin'::app_role,'rh'::app_role]));

-- ============ INDEXES ============
CREATE INDEX idx_budgets_project ON public.budgets(project_id);
CREATE INDEX idx_budget_lines_budget ON public.budget_lines(budget_id);
CREATE INDEX idx_expenses_project ON public.expenses(project_id);
CREATE INDEX idx_expenses_org_date ON public.expenses(organization_id, expense_date DESC);
CREATE INDEX idx_cash_org_date ON public.cash_movements(organization_id, movement_date DESC);
CREATE INDEX idx_attendance_employee_date ON public.attendance(employee_id, date DESC);
CREATE INDEX idx_attendance_org_date ON public.attendance(organization_id, date DESC);
CREATE INDEX idx_emp_docs_employee ON public.employee_documents(employee_id);
CREATE INDEX idx_emp_assign_project ON public.employee_assignments(project_id);
CREATE INDEX idx_vacations_employee ON public.vacation_requests(employee_id);