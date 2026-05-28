import { useEffect, useState } from "react";
import { Activity, Cpu, BarChart3, Radar, ShieldCheck } from "lucide-react";

const ROWS = [
  { icon: Activity, label: "Operaciones activas", base: 78, suffix: "%" },
  { icon: Cpu, label: "Producción", base: 64, suffix: "%" },
  { icon: BarChart3, label: "Analytics", base: 91, suffix: "%" },
  { icon: Radar, label: "Monitoreo", base: 86, suffix: "%" },
  { icon: ShieldCheck, label: "Seguridad", base: 99, suffix: "%" },
];

export function NexusLivePanel() {
  const [vals, setVals] = useState(ROWS.map((r) => r.base));
  useEffect(() => {
    const t = setInterval(() => {
      setVals((prev) =>
        prev.map((v, i) => {
          const target = ROWS[i].base + Math.sin(Date.now() / 1500 + i) * 6;
          return Math.max(20, Math.min(100, Math.round(target + (Math.random() - 0.5) * 3)));
        })
      );
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#7dc4ff]/70 to-transparent" />
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ee07c] shadow-[0_0_8px_#3ee07c] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/80">
            SECOIVSA COD · Live
          </span>
        </div>
        <span className="font-mono text-[10px] text-white/40">v4.2 · stable</span>
      </div>
      <div className="p-5 space-y-3.5">
        {ROWS.map((r, i) => {
          const Icon = r.icon;
          const v = vals[i];
          return (
            <div key={r.label} className="flex items-center gap-4">
              <Icon className="w-3.5 h-3.5 text-[#7dc4ff] shrink-0" strokeWidth={1.6} />
              <span className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-white/65 w-44 shrink-0">
                {r.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#3a7fd9] to-[#7dc4ff] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(125,196,255,0.55)]"
                  style={{ width: `${v}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-white tabular-nums w-12 text-right">
                {v}
                {r.suffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
