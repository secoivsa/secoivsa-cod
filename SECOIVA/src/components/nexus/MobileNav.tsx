import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
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
  Activity,
  Bell,
  CheckSquare,
  Settings,
  Brain,
  FileText,
  Radar,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { signOut } from "@/hooks/use-auth";
import { useState } from "react";

const MODULES = [
  { to: "/nexus", label: "CORE", icon: LayoutDashboard, exact: true },
  { to: "/nexus/intelligence", label: "Intelligence", icon: Brain },
  { to: "/nexus/monitoring", label: "Monitoring", icon: Radar },
  { to: "/nexus/timeline", label: "Timeline", icon: Activity },
  { to: "/nexus/alerts", label: "Alertas", icon: Bell },
  { to: "/nexus/approvals", label: "Aprobaciones", icon: CheckSquare },
  { to: "/nexus/reports", label: "Reportes", icon: FileText },
  { to: "/nexus/projects", label: "Proyectos", icon: Briefcase },
  { to: "/nexus/operations", label: "Operaciones", icon: ClipboardList },
  { to: "/nexus/production", label: "Producción", icon: Factory },
  { to: "/nexus/quality", label: "Calidad", icon: ShieldCheck },
  { to: "/nexus/safety", label: "Seguridad", icon: HardHat },
  { to: "/nexus/finance", label: "Finanzas", icon: DollarSign },
  { to: "/nexus/hr", label: "RH", icon: Users },
  { to: "/nexus/crm", label: "CRM", icon: UserPlus },
  { to: "/nexus/supply", label: "Supply", icon: Truck },
  { to: "/nexus/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menú"
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] active:scale-95 transition"
        >
          <Menu className="h-4 w-4" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-[#0a0d12] border-r border-white/[0.06] text-foreground"
      >
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
            <BrandLogo className="h-7 w-auto" />
            <div className="leading-tight">
              <div className="text-[9px] font-mono tracking-[0.35em] uppercase text-muted-foreground">
                NEXUS OS
              </div>
              <div className="text-[11px] text-foreground/80">Industrial OS</div>
            </div>
          </Link>
        </div>

        <nav className="overflow-y-auto px-3 py-4 max-h-[calc(100vh-160px)]">
          <ul className="space-y-0.5">
            {MODULES.map((m) => {
              const active = m.exact
                ? loc.pathname === m.to
                : loc.pathname.startsWith(m.to);
              return (
                <li key={m.to}>
                  <Link
                    to={m.to as never}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm transition ${
                      active
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    <m.icon className="h-4 w-4 shrink-0" />
                    <span className="font-mono text-[11px] tracking-[0.15em] uppercase">
                      {m.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-white/[0.06] bg-[#0a0d12]">
          <button
            onClick={async () => {
              await signOut();
              setOpen(false);
              nav({ to: "/login" });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase">
              Cerrar sesión
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
