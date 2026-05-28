
-- Extend organizations with enterprise branding & limits
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS commercial_name TEXT,
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#8b5cf6',
  ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS current_plan_code TEXT DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_projects INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Plans catalog
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  yearly_price NUMERIC NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_projects INTEGER NOT NULL DEFAULT 25,
  max_storage_gb INTEGER NOT NULL DEFAULT 5,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

-- Org subscriptions
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.organization_subscriptions TO authenticated;
GRANT ALL ON public.organization_subscriptions TO service_role;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read subscriptions" ON public.organization_subscriptions FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Admin manage subscriptions" ON public.organization_subscriptions FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role]));

-- Invoices
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  folio TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  period_start DATE,
  period_end DATE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.billing_invoices TO authenticated;
GRANT ALL ON public.billing_invoices TO service_role;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read invoices" ON public.billing_invoices FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Admin write invoices" ON public.billing_invoices FOR INSERT TO authenticated WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role, 'finanzas'::app_role]));

-- Login sessions
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  device_label TEXT,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.login_sessions TO authenticated;
GRANT ALL ON public.login_sessions TO service_role;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sessions" ON public.login_sessions FOR SELECT TO authenticated USING (organization_id = current_org_id() AND (user_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role])));
CREATE POLICY "Users insert own sessions" ON public.login_sessions FOR INSERT TO authenticated WITH CHECK (organization_id = current_org_id() AND user_id = auth.uid());
CREATE POLICY "Users revoke own sessions" ON public.login_sessions FOR UPDATE TO authenticated USING (organization_id = current_org_id() AND (user_id = auth.uid() OR has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role])));

-- Security logs
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_logs TO authenticated;
GRANT ALL ON public.security_logs TO service_role;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read security logs" ON public.security_logs FOR SELECT TO authenticated USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role]));
CREATE POLICY "Authenticated insert security logs" ON public.security_logs FOR INSERT TO authenticated WITH CHECK (organization_id = current_org_id());

-- Organization settings (flexible)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id UUID PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT, INSERT, UPDATE ON public.organization_settings TO authenticated;
GRANT ALL ON public.organization_settings TO service_role;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org read settings" ON public.organization_settings FOR SELECT TO authenticated USING (organization_id = current_org_id());
CREATE POLICY "Admin write settings" ON public.organization_settings FOR ALL TO authenticated
  USING (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role]))
  WITH CHECK (organization_id = current_org_id() AND has_any_role(auth.uid(), ARRAY['direccion'::app_role, 'admin'::app_role]));

-- Seed plans
INSERT INTO public.subscription_plans (code, name, description, monthly_price, yearly_price, max_users, max_projects, max_storage_gb, features, order_idx)
VALUES
  ('starter', 'Starter', 'Para equipos pequeños iniciando operación', 0, 0, 10, 25, 5,
    '["CRM básico","Proyectos","Supply","Production","Quality","Safety","HR básico","Reportes PDF"]'::jsonb, 1),
  ('pro', 'Professional', 'Operación industrial completa con IA', 4999, 49990, 50, 200, 50,
    '["Todo de Starter","Workflow Engine","Approvals","AI Executive Insights","Alertas avanzadas","White-label parcial","Soporte prioritario"]'::jsonb, 2),
  ('enterprise', 'Enterprise', 'Multiempresa, white-label completo y SLA', 14999, 149990, 999, 9999, 500,
    '["Todo de Pro","White-label completo","Multiempresa","Super Admin","Auditoría avanzada","SLA 99.9%","Onboarding dedicado","Integraciones custom"]'::jsonb, 3)
ON CONFLICT (code) DO NOTHING;
