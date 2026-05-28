import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Activity,
  Bell,
  CheckSquare,
  Briefcase,
  ClipboardList,
  Factory,
  ShieldCheck,
  HardHat,
  DollarSign,
  Users,
  UserPlus,
  Truck,
  Plus,
  Search as SearchIcon,
  Settings,
  Brain,
  FileText,
  Radar,
  CreditCard,
  Shield,
  Globe,
} from "lucide-react";

const MODULE_NAV = [
  { to: "/nexus", label: "CORE · Dashboard", icon: LayoutDashboard },
  { to: "/nexus/intelligence", label: "Intelligence · Executive AI", icon: Brain },
  { to: "/nexus/monitoring", label: "Monitoring · Live", icon: Radar },
  { to: "/nexus/timeline", label: "Timeline global", icon: Activity },
  { to: "/nexus/alerts", label: "Alertas", icon: Bell },
  { to: "/nexus/approvals", label: "Aprobaciones", icon: CheckSquare },
  { to: "/nexus/reports", label: "Reportes PDF", icon: FileText },
  { to: "/nexus/projects", label: "Proyectos", icon: Briefcase },
  { to: "/nexus/operations", label: "Operaciones", icon: ClipboardList },
  { to: "/nexus/production", label: "Producción", icon: Factory },
  { to: "/nexus/quality", label: "Calidad", icon: ShieldCheck },
  { to: "/nexus/safety", label: "Seguridad", icon: HardHat },
  { to: "/nexus/finance", label: "Finanzas", icon: DollarSign },
  { to: "/nexus/hr", label: "Recursos humanos", icon: Users },
  { to: "/nexus/crm", label: "CRM · Clientes", icon: UserPlus },
  { to: "/nexus/supply", label: "Compras · Supply", icon: Truck },
  { to: "/nexus/billing", label: "Billing · Suscripción", icon: CreditCard },
  { to: "/nexus/security", label: "Security · Sesiones", icon: Shield },
  { to: "/nexus/platform", label: "Platform · Super admin", icon: Globe },
  { to: "/nexus/settings", label: "Settings · Administración", icon: Settings },
];

const QUICK_ACTIONS = [
  { to: "/nexus/intelligence", label: "Generar análisis IA ejecutivo" },
  { to: "/nexus/reports", label: "Generar reporte PDF" },
  { to: "/nexus/projects", label: "Crear proyecto" },
  { to: "/nexus/supply", label: "Nueva requisición" },
  { to: "/nexus/production", label: "Registrar avance" },
  { to: "/nexus/quality", label: "Nueva inspección" },
  { to: "/nexus/safety", label: "Generar permiso" },
  { to: "/nexus/crm", label: "Nuevo cliente / oportunidad" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const debounced = useDebounced(query, 200);

  const { data: results } = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: async () => {
      const q = debounced.trim();
      if (q.length < 2) return { projects: [], clients: [], employees: [] };
      const like = `%${q}%`;
      const [projects, clients, employees] = await Promise.all([
        supabase.from("projects").select("id, name, code, status").or(`name.ilike.${like},code.ilike.${like}`).limit(6),
        supabase.from("clients").select("id, name, rfc").or(`name.ilike.${like},rfc.ilike.${like}`).limit(6),
        supabase.from("employees").select("id, full_name, position").ilike("full_name", like).limit(6),
      ]);
      return {
        projects: projects.data ?? [],
        clients: clients.data ?? [],
        employees: employees.data ?? [],
      };
    },
    enabled: open && debounced.trim().length >= 2,
    staleTime: 30_000,
  });

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to: to as never });
  };

  const hasResults = useMemo(
    () =>
      (results?.projects.length ?? 0) +
        (results?.clients.length ?? 0) +
        (results?.employees.length ?? 0) >
      0,
    [results],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar proyectos, clientes, personal — o ejecutar acción..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs font-mono tracking-wider uppercase">
              Sin resultados
            </span>
          </div>
        </CommandEmpty>

        {hasResults && (
          <>
            {(results?.projects.length ?? 0) > 0 && (
              <CommandGroup heading="Proyectos">
                {results!.projects.map((p: any) => (
                  <CommandItem
                    key={p.id}
                    value={`project-${p.id}-${p.name}`}
                    onSelect={() => go(`/nexus/projects/${p.id}`)}
                  >
                    <Briefcase className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span className="font-mono text-[10px] text-muted-foreground mr-2">
                      {p.code ?? "—"}
                    </span>
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      {p.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(results?.clients.length ?? 0) > 0 && (
              <CommandGroup heading="Clientes">
                {results!.clients.map((c: any) => (
                  <CommandItem
                    key={c.id}
                    value={`client-${c.id}-${c.name}`}
                    onSelect={() => go("/nexus/crm")}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.rfc && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {c.rfc}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(results?.employees.length ?? 0) > 0 && (
              <CommandGroup heading="Personal">
                {results!.employees.map((e: any) => (
                  <CommandItem
                    key={e.id}
                    value={`emp-${e.id}-${e.full_name}`}
                    onSelect={() => go("/nexus/hr")}
                  >
                    <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                    <span className="flex-1 truncate">{e.full_name}</span>
                    {e.position && (
                      <span className="text-[10px] text-muted-foreground">
                        {e.position}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Acciones rápidas">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem key={a.label} onSelect={() => go(a.to)}>
              <Plus className="h-3.5 w-3.5 mr-2 text-primary" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegar">
          {MODULE_NAV.map((m) => (
            <CommandItem key={m.to} onSelect={() => go(m.to)}>
              <m.icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              {m.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
