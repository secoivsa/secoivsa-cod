import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgBranding } from "@/components/nexus/BrandingProvider";
import { Check, Sparkles, CreditCard, Zap, Crown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/billing")({
  component: BillingPage,
});

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const PLAN_ICON: Record<string, typeof Sparkles> = {
  starter: Sparkles,
  pro: Zap,
  enterprise: Crown,
};

function BillingPage() {
  const { data: org } = useOrgBranding();

  const { data: plans } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("order_idx");
      return data ?? [];
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["billing", "invoices"],
    queryFn: async () => {
      const { data } = await supabase
        .from("billing_invoices")
        .select("*")
        .order("issued_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const currentPlan = org?.current_plan_code ?? "starter";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
          NEXUS / BILLING & PLANS
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Suscripción y facturación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan actual:{" "}
          <span className="text-primary font-mono uppercase">{currentPlan}</span>
          {" · "}Estado: <span className="text-foreground">{org?.subscription_status ?? "trial"}</span>
        </p>
      </div>

      {/* Plans */}
      <section>
        <h2 className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground mb-4">
          Planes disponibles
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {plans?.map((p) => {
            const Icon = PLAN_ICON[p.code] ?? Sparkles;
            const active = p.code === currentPlan;
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border p-6 transition ${
                  active
                    ? "bg-primary/[0.06] border-primary/40 shadow-[0_0_40px_-15px_hsl(var(--primary))]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                {active && (
                  <div className="absolute -top-2 left-6 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-mono tracking-[0.2em] uppercase">
                    Plan activo
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                      {p.code}
                    </div>
                    <div className="text-lg font-bold">{p.name}</div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-3xl font-bold">
                    {p.monthly_price === 0 ? "Gratis" : fmtMoney(Number(p.monthly_price))}
                  </div>
                  {p.monthly_price > 0 && (
                    <div className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
                      / mes · {fmtMoney(Number(p.yearly_price))} anual
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-4">{p.description}</p>
                <div className="space-y-1.5 mb-4 text-xs">
                  <Row label="Usuarios" value={p.max_users >= 999 ? "Ilimitados" : p.max_users} />
                  <Row label="Proyectos" value={p.max_projects >= 9999 ? "Ilimitados" : p.max_projects} />
                  <Row label="Storage" value={`${p.max_storage_gb} GB`} />
                </div>
                <ul className="space-y-1.5 mb-5">
                  {(p.features as string[]).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={active}
                  className={`w-full py-2.5 rounded-md font-mono text-[11px] tracking-[0.2em] uppercase transition ${
                    active
                      ? "bg-white/[0.04] text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {active ? "Plan actual" : "Cambiar a este plan"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section>
        <h2 className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" /> Historial de facturación
        </h2>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {!invoices?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay facturas emitidas todavía.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground border-b border-white/[0.06]">
                <tr>
                  <th className="text-left px-4 py-3">Folio</th>
                  <th className="text-left px-4 py-3">Período</th>
                  <th className="text-right px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Emisión</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{inv.folio ?? inv.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {inv.period_start} → {inv.period_end}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmtMoney(Number(inv.amount))}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded ${
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(inv.issued_at).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
