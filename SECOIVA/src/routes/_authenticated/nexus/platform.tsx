import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, Briefcase, TrendingUp, Database, Globe } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/platform")({
  component: PlatformPage,
});

function PlatformPage() {
  const { data } = useQuery({
    queryKey: ["platform", "global"],
    refetchInterval: 60000,
    queryFn: async () => {
      const [orgs, profiles, projects, events, subs] = await Promise.all([
        supabase.from("organizations").select("id,name,commercial_name,current_plan_code,subscription_status,max_users,max_projects,created_at"),
        supabase.from("profiles").select("id,organization_id"),
        supabase.from("projects").select("id,organization_id,status"),
        supabase.from("system_events").select("id,created_at").gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("subscription_plans").select("code,name,monthly_price"),
      ]);
      return {
        orgs: orgs.data ?? [],
        profiles: profiles.data ?? [],
        projects: projects.data ?? [],
        events24h: events.data?.length ?? 0,
        plans: subs.data ?? [],
      };
    },
  });

  if (!data) return null;

  const totalRevenueMonthly = data.orgs.reduce((acc, o) => {
    const plan = data.plans.find((p) => p.code === o.current_plan_code);
    return acc + Number(plan?.monthly_price ?? 0);
  }, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
          NEXUS / PLATFORM ADMIN · NEXUS CLOUD
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Super Admin Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista global multiempresa: organizaciones, consumo, suscripciones y salud de plataforma.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Building2} label="Organizaciones" value={data.orgs.length} />
        <Kpi icon={Users} label="Usuarios globales" value={data.profiles.length} />
        <Kpi icon={Briefcase} label="Proyectos totales" value={data.projects.length} />
        <Kpi
          icon={TrendingUp}
          label="MRR estimado"
          value={new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(totalRevenueMonthly)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Kpi icon={Database} label="Eventos sistema (24h)" value={data.events24h} />
        <Kpi icon={Globe} label="Región" value="LATAM / MX" />
      </div>

      <section>
        <h2 className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground mb-4">
          Organizaciones
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground border-b border-white/[0.06]">
              <tr>
                <th className="text-left px-4 py-3">Organización</th>
                <th className="text-left px-4 py-3">Plan</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Usuarios</th>
                <th className="text-right px-4 py-3">Proyectos</th>
                <th className="text-left px-4 py-3">Alta</th>
              </tr>
            </thead>
            <tbody>
              {data.orgs.map((o) => {
                const users = data.profiles.filter((p) => p.organization_id === o.id).length;
                const projs = data.projects.filter((p) => p.organization_id === o.id).length;
                return (
                  <tr key={o.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{o.commercial_name ?? o.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{o.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {o.current_plan_code ?? "starter"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{o.subscription_status ?? "trial"}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {users}/{o.max_users ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {projs}/{o.max_projects ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">{label}</div>
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
    </div>
  );
}
