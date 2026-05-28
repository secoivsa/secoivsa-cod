import { motion, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

function MiniCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [d, setD] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, {
      duration: 1.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setD(Math.floor(v).toString()),
    });
    return () => c.stop();
  }, [inView, value, mv]);
  return <span ref={ref}>{d}{suffix}</span>;
}

const CLIENTS = [
  { name: "DYNASOL", industry: "Industria Petroquímica", years: "2016 — Presente" },
  { name: "CABOT", industry: "Petroquímica · Carbón", years: "2018 — Presente" },
  { name: "ALPEK", industry: "Polímeros Industriales", years: "2015 — Presente" },
  { name: "INSA", industry: "Industria Química", years: "2019 — Presente" },
];

export function ClientsGrid() {
  return (
    <section id="alianzas" className="relative py-14 md:py-20 px-6 md:px-12 bg-black overflow-hidden">
      {/* blueprint grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,163,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(0,163,255,0.6) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 80%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,163,255,0.07),transparent_55%)]" />

      <div className="relative max-w-[1400px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#00A3FF] mb-4 inline-flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#00A3FF] live-dot" />
            Clientes Estratégicos · Ecosistema Activo
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl md:text-5xl text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase"
          >
            Clientes <span className="text-gradient-brand">estratégicos.</span>
          </motion.h2>
          <p className="mt-5 text-white/60 text-[14px] leading-relaxed">
            Alianzas industriales construidas sobre confianza, ejecución y resultados operativos sostenidos.
          </p>
        </div>

        {/* metrics strip */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] mb-8">
          {[
            { v: 300, s: "+", l: "Proyectos ejecutados" },
            { v: 40, s: "+", l: "Alianzas industriales" },
            { v: 22, s: "", l: "Experiencia industrial" },
          ].map((m) => (
            <div key={m.l} className="bg-black p-6 text-center group relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,163,255,0.15),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative font-cod text-white text-3xl md:text-[40px] font-semibold tracking-tight tabular-nums drop-shadow-[0_0_12px_rgba(0,163,255,0.25)]">
                <MiniCounter value={m.v} suffix={m.s} />
              </div>
              <div className="relative mt-2 font-mono text-[9.5px] tracking-[0.26em] uppercase text-white/55">{m.l}</div>
            </div>
          ))}
        </div>

        {/* logos grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
          {CLIENTS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative bg-black min-h-[180px] flex flex-col items-center justify-center overflow-hidden p-6"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,163,255,0.20),transparent_65%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {/* scan line */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/70 to-transparent animate-scan" />
              </div>

              <span className="relative font-display text-white/55 group-hover:text-white text-[22px] md:text-[26px] tracking-[0.20em] font-medium transition-colors duration-500 uppercase drop-shadow-[0_0_12px_rgba(0,163,255,0.0)] group-hover:drop-shadow-[0_0_12px_rgba(0,163,255,0.4)]">
                {c.name}
              </span>
              <div className="relative mt-4 pt-3 w-full text-center border-t border-white/[0.06] group-hover:border-[#00A3FF]/20 transition-colors">
                <div className="font-mono text-[9px] tracking-[0.26em] uppercase text-white/50">{c.industry}</div>
                <div className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#00A3FF]/70 mt-1">{c.years}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
