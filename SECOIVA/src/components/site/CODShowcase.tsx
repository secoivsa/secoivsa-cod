import { motion, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Activity, ShieldCheck, Layers, Cpu, Radio, Gauge } from "lucide-react";

function LiveCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [d, setD] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, {
      duration: 2.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setD(decimals ? v.toFixed(decimals) : Math.floor(v).toLocaleString("es-MX")),
    });
    return () => c.stop();
  }, [inView, value, mv, decimals]);
  return (
    <span ref={ref}>
      {d}
      {suffix}
    </span>
  );
}

const KPIS = [
  { k: "Producción", v: <LiveCounter value={98.4} decimals={1} suffix="%" />, hint: "Línea operativa", state: "LIVE DATA", glow: "bg-[#7dd3fc]", live: true, priority: true },
  { k: "Frentes activos", v: <LiveCounter value={12} />, hint: "Multi-sitio", state: "SYNC ACTIVE", glow: "bg-[#7dd3fc]", live: true },
  { k: "Sincronización", v: <LiveCounter value={100} suffix="%" />, hint: "COD ↔ Campo", state: "TRACE ONLINE", glow: "bg-emerald-400", live: true, priority: true },
  { k: "Cumplimiento", v: <LiveCounter value={99.7} decimals={1} suffix="%" />, hint: "REPSE · ISO", state: "UPDATED 00:01", glow: "bg-[#7dd3fc]" },
];


export function CODShowcase() {
  return (
    <section id="cod" className="relative py-14 md:py-20 px-6 md:px-12 bg-[#030507] overflow-hidden">
      {/* tech grid + glow ambiental */}
      <div className="absolute inset-0 bg-grid-tech opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(0,163,255,0.14),transparent_55%),radial-gradient(ellipse_at_85%_75%,rgba(0,163,255,0.08),transparent_55%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,163,255,0.08),transparent_70%)] blur-3xl pointer-events-none" />

      <div className="relative max-w-[1480px] mx-auto">
        <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-end mb-10 md:mb-14">
          <div className="md:col-span-7">
            <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#00A3FF] mb-4 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] live-dot" />
              Centro de Operación Digital · Live
            </p>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[54px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
              Centro de Operación<br />
              <span className="text-gradient-brand">Digital.</span>
            </h2>
            <p className="mt-4 font-mono text-[10px] md:text-[11px] tracking-[0.32em] uppercase text-white/45">
              SECOIVSA COD — MX INDUSTRIAL NETWORK · MONITOREO OPERATIVO 24/7
            </p>
          </div>
          <p className="md:col-span-5 text-white/65 text-[14px] leading-relaxed">
            Producción, operación, evidencias y control integrados en una sola
            plataforma. Monitoreo activo 24/7 con visibilidad total sobre cada
            frente industrial.
          </p>
        </div>


        {/* SCADA panel */}
        <div className="relative grid lg:grid-cols-12 gap-4">
          {/* Main visual */}
          <div className="relative lg:col-span-8 aspect-[16/10] overflow-hidden border border-white/[0.08] bg-black">
            <img
              src="https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1900&auto=format&fit=crop&q=80"
              alt="Operación industrial"
              className="absolute inset-0 w-full h-full object-cover opacity-65"
              style={{ filter: "contrast(1.08) brightness(1.05) saturate(1.0)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,163,255,0.08),transparent_60%)]" />

            {/* HUD frame */}
            <div className="absolute inset-3 border border-[#00A3FF]/25 pointer-events-none">
              <span className="absolute -top-px -left-px w-5 h-5 border-t-2 border-l-2 border-[#00A3FF]" />
              <span className="absolute -top-px -right-px w-5 h-5 border-t-2 border-r-2 border-[#00A3FF]" />
              <span className="absolute -bottom-px -left-px w-5 h-5 border-b-2 border-l-2 border-[#00A3FF]" />
              <span className="absolute -bottom-px -right-px w-5 h-5 border-b-2 border-r-2 border-[#00A3FF]" />
            </div>

            {/* Scan line */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF] to-transparent animate-scan shadow-[0_0_18px_#00A3FF]" />
            </div>

            {/* Top bar */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between font-mono text-[9.5px] tracking-[0.28em] uppercase text-white/80">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] live-dot" />
                <span>COD-MX-01 · Altamira</span>
              </div>
              <div className="flex items-center gap-4">
                <span>SIG · 92%</span>
                <span className="text-[#00A3FF]">● LIVE</span>
              </div>
            </div>

            {/* Radar + tracking SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500" preserveAspectRatio="none">
              <defs>
                <radialGradient id="radarGrad">
                  <stop offset="0%" stopColor="#00A3FF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00A3FF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00A3FF" stopOpacity="0" />
                  <stop offset="50%" stopColor="#00A3FF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00A3FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* tracking nodes */}
              {[
                [180, 140], [340, 220], [520, 160], [640, 320], [260, 360], [460, 380],
              ].map(([x, y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="3" fill="#00A3FF" />
                  <circle cx={x} cy={y} r="3" fill="#00A3FF" opacity="0.5">
                    <animate attributeName="r" values="3;14;3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
              {/* data lines */}
              <path d="M180 140 L340 220 L520 160 L640 320" fill="none" stroke="url(#flowGrad)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M260 360 L460 380 L640 320" fill="none" stroke="url(#flowGrad)" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* Bottom mini stats */}
            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-3 font-mono text-[9.5px] tracking-[0.22em] uppercase">
              {[
                ["Turnos", "3"],
                ["SLA", "99.7%"],
                ["Uptime", "100%"],
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-2.5 bg-black/55 backdrop-blur border border-[#00A3FF]/20">
                  <div className="text-white/45">{k}</div>
                  <div className="text-white mt-1 text-[12px] tracking-tight font-sans font-light">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Side: system status — mapa operativo */}
          <div className="lg:col-span-4">
            <div className="relative h-full overflow-hidden border border-white/[0.08] bg-black p-6 min-h-[260px]">
              {/* corner ticks */}
              <span className="absolute top-0 left-0 w-3 h-px bg-[#00A3FF]/60" />
              <span className="absolute top-0 left-0 w-px h-3 bg-[#00A3FF]/60" />
              <span className="absolute top-0 right-0 w-3 h-px bg-[#00A3FF]/60" />
              <span className="absolute top-0 right-0 w-px h-3 bg-[#00A3FF]/60" />

              <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-white/55 mb-5 flex items-center justify-between">
                <span>Sistemas COD · Map</span>
                <span className="text-[#00A3FF] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] live-dot" /> Live
                </span>
              </div>

              {/* línea conectora vertical */}
              <div className="absolute left-[34px] top-[68px] bottom-6 w-px bg-gradient-to-b from-[#00A3FF]/50 via-[#00A3FF]/15 to-transparent" />

              <ul className="space-y-3">
                {[
                  { icon: Cpu, l: "Núcleo COD", s: "Operativo" },
                  { icon: Radio, l: "Telemetría", s: "Sincronizado" },
                  { icon: Layers, l: "Multi-frente", s: "12 activos" },
                  { icon: ShieldCheck, l: "Seguridad", s: "Sin alertas" },
                  { icon: Gauge, l: "Performance", s: "Óptimo" },
                  { icon: Activity, l: "Pulso", s: "Estable" },
                ].map(({ icon: Icon, l, s }) => (
                  <li key={l} className="group flex items-center justify-between text-[11.5px] text-white/80 hover:text-white transition-colors relative pl-1">
                    <span className="flex items-center gap-2.5">
                      <span className="relative w-4 h-4 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-[#00A3FF] relative z-10" strokeWidth={1.6} />
                        <span className="absolute inset-0 rounded-full bg-[#00A3FF]/15 blur-[3px]" />
                      </span>
                      {l}
                    </span>
                    <span className="flex items-center gap-2 text-white/60 font-mono text-[9.5px] tracking-[0.18em] uppercase">
                      <span className="relative flex items-center justify-center">
                        <span className="absolute w-3 h-3 rounded-full bg-emerald-400/30 blur-[2px] animate-ping" />
                        <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      </span>
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* KPI strip — dashboard tecnológico */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">


          {KPIS.map((kpi, i) => (
            <motion.div
              key={kpi.k}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`group relative bg-[#030507] p-5 md:p-6 overflow-hidden ${kpi.priority ? "ring-1 ring-[#00A3FF]/15" : ""}`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/40 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
              {kpi.priority && (
                <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_50%_100%,rgba(0,163,255,0.15),transparent_60%)]" />
              )}
              <div className="relative flex items-center justify-between mb-3">
                <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/55">{kpi.k}</span>
                {kpi.live && (
                  <span className="relative flex items-center justify-center">
                    <span className={`absolute w-3 h-3 rounded-full ${kpi.glow} opacity-30 blur-[2px] animate-ping`} />
                    <span className={`relative w-1.5 h-1.5 rounded-full ${kpi.glow} shadow-[0_0_8px_currentColor]`} />
                  </span>
                )}
              </div>
              <div className={`relative font-cod text-white font-semibold tracking-tight tabular-nums drop-shadow-[0_0_12px_rgba(0,163,255,0.2)] ${kpi.priority ? "text-4xl md:text-[44px]" : "text-3xl md:text-[34px]"}`}>
                {kpi.v}
              </div>
              <div className="relative mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/45">{kpi.hint}</span>
                <span className="font-mono text-[8px] tracking-[0.26em] uppercase text-[#00A3FF]/75">{kpi.state}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
