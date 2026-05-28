import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  Factory,
  ShieldCheck,
  HardHat,
  DollarSign,
  Users,
  UserPlus,
  Truck,
  LogOut,
  ChevronRight,
  Cpu,
  Activity,
  Bell,
  CheckSquare,
  Settings,
  Brain,
  FileText,
  Radar,
  CreditCard,
  Shield,
  Globe,
  Gauge,
  Mail,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { signOut } from "@/hooks/use-auth";

type ModuleItem = {
  code: string;
  to: string;
  label: string;
  desc: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const MODULES: ModuleItem[] = [
  { code: "01", to: "/nexus", label: "CORE", desc: "Dashboard ejecutivo", icon: LayoutDashboard, exact: true },
  { code: "AI", to: "/nexus/intelligence", label: "INTELLIGENCE", desc: "Executive AI + insights", icon: Brain },
  { code: "◉", to: "/nexus/monitoring", label: "MONITORING", desc: "Operación en vivo", icon: Radar },
  { code: "★", to: "/nexus/timeline", label: "TIMELINE", desc: "Actividad global", icon: Activity },
  { code: "!", to: "/nexus/alerts", label: "ALERTAS", desc: "Centro de alertas", icon: Bell },
  { code: "✓", to: "/nexus/approvals", label: "APROBACIONES", desc: "Flujos de aprobación", icon: CheckSquare },
  { code: "✉", to: "/nexus/mail-hub", label: "MAIL HUB", desc: "Inbox unificado · routing", icon: Mail },
  { code: "▤", to: "/nexus/reports", label: "REPORTES", desc: "Centro de reportes PDF", icon: FileText },
  { code: "02", to: "/nexus/projects", label: "PROJECTS", desc: "Proyectos", icon: Briefcase },
  { code: "03", to: "/nexus/operations", label: "OPERATIONS", desc: "Operación y logística", icon: ClipboardList },
  { code: "04", to: "/nexus/production", label: "PRODUCTION", desc: "Producción", icon: Factory },
  { code: "05", to: "/nexus/quality", label: "QUALITY", desc: "Calidad", icon: ShieldCheck },
  { code: "06", to: "/nexus/safety", label: "SAFETY", desc: "Seguridad", icon: HardHat },
  { code: "07", to: "/nexus/finance", label: "FINANCE", desc: "Finanzas", icon: DollarSign },
  { code: "08", to: "/nexus/hr", label: "HR", desc: "Recursos humanos", icon: Users },
  { code: "RH", to: "/nexus/recruiting", label: "RECRUITING", desc: "Bot WhatsApp · candidatos", icon: UserPlus },
  { code: "E2", to: "/nexus/recruiting-enterprise", label: "RH ENTERPRISE", desc: "Agenda · OCR · métricas · auditoría", icon: Gauge },
  { code: "WA", to: "/nexus/whatsapp-bridge", label: "WHATSAPP", desc: "Bridge QR · sesión · cola", icon: Mail },
  { code: "09", to: "/nexus/crm", label: "CRM", desc: "Clientes", icon: UserPlus },
  { code: "10", to: "/nexus/supply", label: "SUPPLY", desc: "Compras / proveedores", icon: Truck },
  { code: "$", to: "/nexus/billing", label: "BILLING", desc: "Suscripción & planes", icon: CreditCard },
  { code: "⌬", to: "/nexus/security", label: "SECURITY", desc: "Sesiones & auditoría", icon: Shield },
  { code: "◎", to: "/nexus/platform", label: "PLATFORM", desc: "Super admin · multiempresa", icon: Globe },
  { code: "⚡", to: "/nexus/observability", label: "OBSERVABILITY", desc: "Salud técnica · latencia", icon: Gauge },
  { code: "⌘", to: "/nexus/security-center", label: "SECURITY CENTER", desc: "Hardening & readiness", icon: ShieldCheck },
  { code: "✦", to: "/nexus/qa", label: "QA", desc: "Production QA · score", icon: Gauge },
  { code: "⚙", to: "/nexus/settings", label: "SETTINGS", desc: "Administración", icon: Settings },
];

export function NexusSidebar() {
  const loc = useLocation();
  const nav = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-[#0a0d12] border-r border-white/[0.06]">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo className="h-7 w-auto" />
          <div className="leading-tight">
            <div className="text-[9px] font-mono tracking-[0.35em] uppercase text-muted-foreground">SECOIVSA COD</div>
            <div className="text-[11px] text-foreground/80">Industrial OS · v1.0</div>
          </div>
        </Link>
      </div>

      <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <Cpu className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
          Módulos operativos
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {MODULES.map((m) => {
            const active = m.exact ? loc.pathname === m.to : loc.pathname.startsWith(m.to);
            return (
              <li key={m.to}>
                <Link
                  to={m.to as never}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-primary" />
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground/70 w-5 shrink-0">
                    {m.code}
                  </span>
                  <m.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 font-mono text-[11px] tracking-[0.12em] uppercase">
                    {m.label}
                  </span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={async () => {
            await signOut();
            nav({ to: "/login" });
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-mono text-[11px] tracking-[0.15em] uppercase">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
