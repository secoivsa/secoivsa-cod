
-- ============================================================
-- NEXUS OS — Sub-fase 2.A: Fundamentos
-- ============================================================

-- =========== ENUMS ===========
CREATE TYPE public.app_role AS ENUM (
  'direccion','admin','produccion','calidad','seguridad',
  'finanzas','rh','compras','supervisor','cliente','proveedor'
);

CREATE TYPE public.project_status AS ENUM (
  'planeacion','en_curso','pausado','completado','cancelado'
);

CREATE TYPE public.client_status AS ENUM ('activo','prospecto','inactivo');
CREATE TYPE public.supplier_status AS ENUM ('activo','en_evaluacion','inactivo');
CREATE TYPE public.employee_status AS ENUM ('activo','baja','suspendido','candidato');

-- =========== UTIL TRIGGER ===========
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========== ORGANIZATIONS ===========
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  rfc TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Seed SECOIVSA
INSERT INTO public.organizations (id, name, slug, legal_name)
VALUES ('00000000-0000-0000-0000-000000000001','SECOIVSA','secoivsa','Servicios de Construcción Industrial SA de CV');

CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== USER_ROLES ===========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, organization_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========== SECURITY DEFINER FUNCTIONS ===========
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND organization_id = _org_id);
$$;

-- =========== AUTO-CREATE PROFILE ON SIGNUP ===========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _is_first BOOLEAN;
  _default_org UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO _is_first;

  INSERT INTO public.profiles (id, organization_id, email, full_name)
  VALUES (
    NEW.id,
    _default_org,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1))
  );

  -- First user becomes direccion + admin automatically
  IF _is_first THEN
    INSERT INTO public.user_roles (user_id, role, organization_id) VALUES (NEW.id, 'direccion', _default_org);
    INSERT INTO public.user_roles (user_id, role, organization_id) VALUES (NEW.id, 'admin', _default_org);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== RLS POLICIES (orgs/profiles/roles) ===========
CREATE POLICY "Members read own org" ON public.organizations
FOR SELECT TO authenticated USING (public.is_org_member(id));

CREATE POLICY "Admin update own org" ON public.organizations
FOR UPDATE TO authenticated USING (public.is_org_member(id) AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Read own profile or same org" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR organization_id = public.current_org_id());

CREATE POLICY "Update own profile" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin manage profiles in org" ON public.profiles
FOR ALL TO authenticated
USING (organization_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'))
WITH CHECK (organization_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Read roles in own org" ON public.user_roles
FOR SELECT TO authenticated USING (organization_id = public.current_org_id());

CREATE POLICY "Admin manage roles in org" ON public.user_roles
FOR ALL TO authenticated
USING (organization_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'))
WITH CHECK (organization_id = public.current_org_id() AND public.has_role(auth.uid(),'admin'));

-- =========== MASTER TABLES ===========

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  legal_name TEXT,
  rfc TEXT,
  industry TEXT,
  status public.client_status NOT NULL DEFAULT 'prospecto',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'México',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_org ON public.clients(organization_id);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Org members read clients" ON public.clients
FOR SELECT TO authenticated USING (organization_id = public.current_org_id());

CREATE POLICY "Comercial/admin write clients" ON public.clients
FOR ALL TO authenticated
USING (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::public.app_role[]))
WITH CHECK (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','supervisor']::public.app_role[]));

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'planeacion',
  location TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(14,2),
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  project_manager_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Org members read projects" ON public.projects
FOR SELECT TO authenticated USING (organization_id = public.current_org_id());

CREATE POLICY "Ops/admin write projects" ON public.projects
FOR ALL TO authenticated
USING (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::public.app_role[]))
WITH CHECK (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','produccion','supervisor']::public.app_role[]));

-- SUPPLIERS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  legal_name TEXT,
  rfc TEXT,
  category TEXT,
  status public.supplier_status NOT NULL DEFAULT 'en_evaluacion',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_suppliers_org ON public.suppliers(organization_id);
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Org members read suppliers" ON public.suppliers
FOR SELECT TO authenticated USING (organization_id = public.current_org_id());

CREATE POLICY "Compras/admin write suppliers" ON public.suppliers
FOR ALL TO authenticated
USING (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::public.app_role[]))
WITH CHECK (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','compras']::public.app_role[]));

-- EMPLOYEES
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_code TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  status public.employee_status NOT NULL DEFAULT 'activo',
  hire_date DATE,
  termination_date DATE,
  curp TEXT,
  rfc TEXT,
  nss TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_employees_org ON public.employees(organization_id);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "RH/admin read employees" ON public.employees
FOR SELECT TO authenticated USING (
  organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','rh','supervisor']::public.app_role[])
);

CREATE POLICY "RH/admin write employees" ON public.employees
FOR ALL TO authenticated
USING (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','rh']::public.app_role[]))
WITH CHECK (organization_id = public.current_org_id()
  AND public.has_any_role(auth.uid(), ARRAY['direccion','admin','rh']::public.app_role[]));
