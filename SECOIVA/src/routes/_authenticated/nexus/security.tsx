import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Monitor, AlertCircle, Lock, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const { data: sessions } = useQuery({
    queryKey: ["security", "sessions"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase
        .from("login_sessions")
        .select("*")
        .order("last_active_at", { ascending: false })
        .limit(40);
      return data ?? [];
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["security", "logs"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  const active = sessions?.filter((s) => !s.revoked) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
          NEXUS / SECURITY CENTER
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Seguridad avanzada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sesiones activas, dispositivos conectados y auditoría enterprise.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Monitor} label="Sesiones activas" value={active.length} />
        <Stat icon={Shield} label="Eventos 24h" value={logs?.filter((l) => Date.now() - new Date(l.created_at).getTime() < 86400000).length ?? 0} />
        <Stat icon={AlertCircle} label="Sesiones revocadas" value={sessions?.filter((s) => s.revoked).length ?? 0} />
        <Stat icon={Lock} label="Política" value="Enterprise" />
      </div>

      <section>
        <h2 className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5" /> Sesiones y dispositivos
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {!sessions?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Aún no se han registrado sesiones explícitas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground border-b border-white/[0.06]">
                <tr>
                  <th className="text-left px-4 py-3">Dispositivo</th>
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Inicio</th>
                  <th className="text-left px-4 py-3">Última actividad</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 text-xs">{s.device_label ?? s.user_agent?.slice(0, 40) ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.ip_address ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.last_active_at).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded ${
                          s.revoked
                            ? "bg-red-500/10 text-red-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {s.revoked ? "Revocada" : "Activa"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" /> Auditoría de seguridad
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          {!logs?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Sin eventos de seguridad recientes.
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {logs.map((l) => (
                <li key={l.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11px] tracking-[0.15em] uppercase">{l.event_type}</div>
                    <div className="text-xs text-muted-foreground truncate">{l.description ?? "—"}</div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {new Date(l.created_at).toLocaleString("es-MX")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Shield; label: string; value: React.ReactNode }) {
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
