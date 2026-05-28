
-- ============================================================
-- SUB-FASE 2.C — SUPPLY + PRODUCTION OPERATIVO
-- ============================================================

-- ===== ENUMS =====
CREATE TYPE public.requisition_status AS ENUM ('borrador','en_revision','aprobada','rechazada','comprada','recibida','cerrada');
CREATE TYPE public.purchase_order_status AS ENUM ('borrador','enviada','confirmada','parcial','recibida','cancelada','cerrada');
CREATE TYPE public.warehouse_movement_type AS ENUM ('entrada','salida','ajuste','transferencia');
CREATE TYPE public.progress_status AS ENUM ('en_curso','pausado','completado');
CREATE TYPE public.evidence_kind AS ENUM ('foto','video','documento');
CREATE TYPE public.work_front_status AS ENUM ('planeado','activo','pausado','completado');

-- ===== MATERIALS (catálogo) =====
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pza',
  category TEXT,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read materials" ON public.materials FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Compras/admin write materials" ON public.materials FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]));
CREATE TRIGGER trg_materials_updated BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== REQUISITIONS =====
CREATE SEQUENCE IF NOT EXISTS public.requisition_folio_seq START 1;
CREATE TABLE public.requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  folio TEXT NOT NULL,
  project_id UUID,
  title TEXT NOT NULL,
  notes TEXT,
  status public.requisition_status NOT NULL DEFAULT 'borrador',
  needed_by DATE,
  requested_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  total NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisitions TO authenticated;
GRANT ALL ON public.requisitions TO service_role;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read requisitions" ON public.requisitions FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Ops/compras write requisitions" ON public.requisitions FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]));
CREATE TRIGGER trg_requisitions_updated BEFORE UPDATE ON public.requisitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.assign_requisition_folio()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'REQ-' || to_char(now(),'YY') || '-' || lpad(nextval('public.requisition_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_requisitions_folio BEFORE INSERT ON public.requisitions FOR EACH ROW EXECUTE FUNCTION public.assign_requisition_folio();

CREATE TABLE public.requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL,
  material_id UUID,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pza',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisition_items TO authenticated;
GRANT ALL ON public.requisition_items TO service_role;
ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of org requisitions" ON public.requisition_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM requisitions r WHERE r.id = requisition_items.requisition_id AND r.organization_id = current_org_id()));
CREATE POLICY "Ops/compras write requisition items" ON public.requisition_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM requisitions r WHERE r.id = requisition_items.requisition_id AND r.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM requisitions r WHERE r.id = requisition_items.requisition_id AND r.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]));

-- ===== PURCHASE ORDERS =====
CREATE SEQUENCE IF NOT EXISTS public.po_folio_seq START 1;
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  folio TEXT NOT NULL,
  requisition_id UUID,
  supplier_id UUID,
  project_id UUID,
  status public.purchase_order_status NOT NULL DEFAULT 'borrador',
  currency TEXT NOT NULL DEFAULT 'MXN',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  expected_date DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read POs" ON public.purchase_orders FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Compras write POs" ON public.purchase_orders FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]));
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.assign_po_folio()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folio IS NULL OR NEW.folio = '' THEN
    NEW.folio := 'OC-' || to_char(now(),'YY') || '-' || lpad(nextval('public.po_folio_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_po_folio BEFORE INSERT ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.assign_po_folio();

CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL,
  material_id UUID,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pza',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read items of org POs" ON public.purchase_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.organization_id = current_org_id()));
CREATE POLICY "Compras write PO items" ON public.purchase_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.organization_id = current_org_id())
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::app_role[]));

-- ===== WAREHOUSE MOVEMENTS =====
CREATE TABLE public.warehouse_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  material_id UUID NOT NULL,
  project_id UUID,
  purchase_order_id UUID,
  movement_type public.warehouse_movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_movements TO authenticated;
GRANT ALL ON public.warehouse_movements TO service_role;
ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read movements" ON public.warehouse_movements FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Compras/produccion write movements" ON public.warehouse_movements FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','compras','produccion','supervisor']::app_role[]));

-- Trigger: update material.stock on movement
CREATE OR REPLACE FUNCTION public.apply_warehouse_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _delta NUMERIC;
BEGIN
  IF NEW.movement_type = 'entrada' THEN _delta := NEW.quantity;
  ELSIF NEW.movement_type = 'salida' THEN _delta := -NEW.quantity;
  ELSIF NEW.movement_type = 'ajuste' THEN _delta := NEW.quantity;
  ELSE _delta := 0;
  END IF;
  UPDATE public.materials SET stock = stock + _delta, updated_at = now() WHERE id = NEW.material_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_warehouse_movement AFTER INSERT ON public.warehouse_movements FOR EACH ROW EXECUTE FUNCTION public.apply_warehouse_movement();

-- ===== PRODUCTION: WORK FRONTS =====
CREATE TABLE public.work_fronts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  supervisor_id UUID,
  status public.work_front_status NOT NULL DEFAULT 'planeado',
  start_date DATE,
  end_date DATE,
  progress_pct NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_fronts TO authenticated;
GRANT ALL ON public.work_fronts TO service_role;
ALTER TABLE public.work_fronts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read work_fronts" ON public.work_fronts FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Ops write work_fronts" ON public.work_fronts FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]));
CREATE TRIGGER trg_wf_updated BEFORE UPDATE ON public.work_fronts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== PROGRESS ENTRIES =====
CREATE TABLE public.progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  work_front_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  progress_pct NUMERIC NOT NULL DEFAULT 0,
  hours NUMERIC NOT NULL DEFAULT 0,
  personnel_count INT NOT NULL DEFAULT 0,
  status public.progress_status NOT NULL DEFAULT 'en_curso',
  reported_at DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_entries TO authenticated;
GRANT ALL ON public.progress_entries TO service_role;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read progress" ON public.progress_entries FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Ops write progress" ON public.progress_entries FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]));
CREATE TRIGGER trg_progress_updated BEFORE UPDATE ON public.progress_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync project progress on entry (uses max reported pct)
CREATE OR REPLACE FUNCTION public.sync_project_progress()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _avg NUMERIC;
BEGIN
  SELECT COALESCE(MAX(progress_pct),0) INTO _avg FROM public.progress_entries WHERE project_id = NEW.project_id;
  UPDATE public.projects SET progress_pct = _avg, updated_at = now() WHERE id = NEW.project_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_sync_project_progress AFTER INSERT OR UPDATE ON public.progress_entries FOR EACH ROW EXECUTE FUNCTION public.sync_project_progress();

-- ===== EVIDENCES =====
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  progress_entry_id UUID,
  work_front_id UUID,
  kind public.evidence_kind NOT NULL DEFAULT 'foto',
  title TEXT,
  description TEXT,
  file_url TEXT NOT NULL,
  file_path TEXT,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidences TO authenticated;
GRANT ALL ON public.evidences TO service_role;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read evidences" ON public.evidences FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Ops write evidences" ON public.evidences FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor','calidad','seguridad']::app_role[]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor','calidad','seguridad']::app_role[]));

-- ===== STORAGE BUCKET (privado) =====
INSERT INTO storage.buckets (id, name, public) VALUES ('evidences','evidences', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members read evidence files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidences' AND (storage.foldername(name))[1] = current_org_id()::text);
CREATE POLICY "Ops upload evidence files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidences' AND (storage.foldername(name))[1] = current_org_id()::text
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor','calidad','seguridad']::app_role[]));
CREATE POLICY "Ops delete evidence files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'evidences' AND (storage.foldername(name))[1] = current_org_id()::text
    AND has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::app_role[]));
