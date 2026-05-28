import { type LucideIcon, Sparkles } from "lucide-react";

export function ModulePlaceholder({
  code,
  title,
  description,
  icon: Icon,
  features,
}: {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}) {
  return (
    <div className="p-6 lg:p-10 max-w-[1400px]">
      <div className="flex items-start gap-5">
        <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            {code} · módulo NEXUS OS
          </p>
          <h1 className="mt-1 text-3xl lg:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{description}</p>
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((f, i) => (
          <div
            key={f}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30 transition"
          >
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-1 text-sm text-foreground/90">{f}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-primary/20 bg-primary/[0.04] p-5 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium">Módulo en construcción</p>
          <p className="text-xs text-muted-foreground">
            La arquitectura base ya está lista. Activación operativa en sub-fases siguientes.
          </p>
        </div>
      </div>
    </div>
  );
}
