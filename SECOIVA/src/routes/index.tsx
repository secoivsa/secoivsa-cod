import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Flame,
  Hammer,
  Building2,
  Construction,
  Wrench,
  SprayCan,
  ShieldCheck,
  Leaf,
  HardHat,
  Award,
  Send,
  Target,
  Eye,
  Gem,
  IdCard,
  GraduationCap,
  Users,
  BadgeCheck,
  TrendingUp,
  MapPin,
} from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CustomCursor } from "@/components/site/CustomCursor";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { ScrollTop } from "@/components/site/ScrollTop";
import { AmbientFx } from "@/components/site/AmbientFx";
import { CODShowcase } from "@/components/site/CODShowcase";
import { ClientsGrid } from "@/components/site/ClientsGrid";
import operacionIzaje from "@/assets/operacion-industrial-izaje.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SECOIVSA — Construcción Industrial · Centro de Operación Digital" },
      {
        name: "description",
        content:
          "Construcción industrial impulsada por operación inteligente. 22+ años de ingeniería, montaje y mantenimiento industrial en México con monitoreo COD en tiempo real.",
      },
      { property: "og:title", content: "SECOIVSA — Construcción Industrial" },
      {
        property: "og:description",
        content:
          "Ingeniería, construcción industrial, ejecución y control operativo bajo procesos estructurados y seguimiento en tiempo real.",
      },
    ],
  }),
  component: Landing,
});

/* ---------- Helpers ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
  y = 30,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-70px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.95, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.floor(v).toString()),
    });
    return () => c.stop();
  }, [inView, value, mv]);
  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

function Eyebrow({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "orange" }) {
  return (
    <p className={`font-mono text-[10px] tracking-[0.4em] uppercase mb-5 ${color === "blue" ? "text-[#00A3FF]" : "text-[#00A3FF]"}`}>
      — {children}
    </p>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1.14]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  // Force iOS Safari autoplay
  useEffect(() => {
    const t = setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        v.muted = true;
        v.play().catch(() => {});
      }
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // Alternating status chip (OPERACIÓN ACTIVA • 24/7 ↔ COD ONLINE • ALTAMIRA, MX)
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStatusIdx((i) => (i + 1) % 2), 4200);
    return () => clearInterval(t);
  }, []);
  const statusLabels = ["Operación activa · 24/7", "COD online · Altamira, MX"];

  const particles = Array.from({ length: 14 });

  return (
    <section
      id="top"
      ref={ref}
      className="relative w-full overflow-hidden bg-black"
      style={{ minHeight: "100svh", height: "100dvh" }}
    >
      {/* Layer 1 — video */}
      <motion.div style={{ y, scale }} className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          src="/hero-drone.mp4"
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          // @ts-ignore — iOS Safari hint
          webkit-playsinline="true"
          disablePictureInPicture
          className="w-full h-full object-cover"
          style={{ backgroundColor: "#000" }}
        />
      </motion.div>

      {/* Layer 2 — cinematic darkening */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/85" />

      {/* Layer 3 — industrial blue tint */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(0,80,160,0.18),transparent_60%)]" />

      {/* Layer 4 — vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* Layer 5 — film grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Layer 6 — scan line (industrial monitor feel) */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 h-[2px] pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(0,163,255,0.35), transparent)",
          boxShadow: "0 0 18px rgba(0,163,255,0.35)",
        }}
        initial={{ top: "-2%" }}
        animate={{ top: ["-2%", "102%"] }}
        transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
      />

      {/* Layer 7 — floating particles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((_, i) => {
          const left = (i * 53) % 100;
          const top = (i * 37) % 100;
          const dur = 8 + (i % 5) * 2;
          const delay = (i % 7) * 0.6;
          return (
            <motion.span
              key={i}
              className="absolute w-[2px] h-[2px] rounded-full bg-[#7dc4ff]"
              style={{ left: `${left}%`, top: `${top}%`, boxShadow: "0 0 6px #00A3FF" }}
              animate={{ y: [-10, -40, -10], opacity: [0, 0.7, 0] }}
              transition={{ duration: dur, delay, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </div>

      {/* Technical lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 mix-blend-screen" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <line x1="0" y1="120" x2="1200" y2="120" stroke="#00A3FF" strokeOpacity="0.18" strokeDasharray="3 6" />
        <line x1="0" y1="680" x2="1200" y2="680" stroke="#00A3FF" strokeOpacity="0.14" strokeDasharray="3 6" />
      </svg>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 min-h-[100svh] flex flex-col items-center justify-center text-center px-5 sm:px-6 pt-24 sm:pt-32 md:pt-40 lg:pt-28 xl:pt-24 pb-24 md:pb-28 lg:pb-20"
      >
        {/* Status chip — alternating */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/15 bg-black/40 backdrop-blur-sm font-mono text-[9px] sm:text-[10px] tracking-[0.32em] uppercase text-white/75 mb-7 sm:mb-9 lg:mb-7"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-[#00FF94] animate-ping opacity-60" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_8px_#00FF94]" />
          </span>
          <AnimatePresenceLite k={statusIdx}>
            {statusLabels[statusIdx]}
          </AnimatePresenceLite>
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-white tracking-[-0.02em] uppercase font-semibold max-w-[1080px] lg:max-w-[1180px] mx-auto"
          style={{
            fontSize: "clamp(2.35rem, 6.4vw, 5rem)",
            lineHeight: 0.98,
          }}
        >
          <span className="block bg-gradient-to-r from-white via-white to-white/85 bg-clip-text text-transparent">
            Operamos
          </span>
          <span
            className="block bg-gradient-to-r from-[#4DA6FF] via-[#7dc4ff] to-[#00A3FF] bg-clip-text text-transparent"
            style={{ textShadow: "0 0 40px rgba(0,163,255,0.25)" }}
          >
            Infraestructura
          </span>
          <span className="block bg-gradient-to-r from-[#4DA6FF] via-[#7dc4ff] to-[#00A3FF] bg-clip-text text-transparent">
            Crítica
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 sm:mt-8 lg:mt-7 text-white/65 leading-relaxed max-w-[480px] lg:max-w-[560px] mx-auto"
          style={{ fontSize: "clamp(0.92rem, 1.35vw, 1.05rem)" }}
        >
          Datos, operación y ejecución
          integrados en una sola plataforma.
        </motion.p>

        {/* Single primary CTA + microtext */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 sm:mt-12 lg:mt-10 flex flex-col items-center justify-center gap-4 w-full px-2"
        >
          <a
            href="/login"
            data-cursor="hover"
            translate="no"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 border border-[#00A3FF]/40 bg-[#00A3FF]/[0.08] backdrop-blur-md text-white font-mono text-[11px] tracking-[0.32em] uppercase font-medium overflow-hidden transition-all duration-500 hover:border-[#00A3FF]/80 hover:bg-[#00A3FF]/[0.14] hover:shadow-[0_0_48px_-8px_#00A3FF]"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-[#00A3FF] animate-ping opacity-60" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
            </span>
            <span className="relative z-10">Entrar al COD</span>
            <ArrowUpRight className="relative z-10 w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </a>
          <p className="font-mono text-[9px] tracking-[0.42em] uppercase text-white/35">
            Producción · Operación · Evidencias · Control
          </p>
        </motion.div>

        {/* Scroll indicator — HUD futurista */}
        <motion.a
          href="#operaciones"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1.2 }}
          aria-label="Deslizar"
          className="absolute bottom-8 md:bottom-10 lg:bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group"
        >
          <span className="font-mono text-[8.5px] tracking-[0.5em] uppercase text-white/45 group-hover:text-white/85 transition-colors">
            Deslizar
          </span>
          <span className="relative grid place-items-center w-9 h-9">
            <motion.span
              className="absolute inset-0 rounded-full border border-[#00A3FF]/45"
              style={{ boxShadow: "0 0 18px -2px rgba(0,163,255,0.5)" }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
            />
            <span className="absolute inset-1.5 rounded-full border border-[#00A3FF]/25" />
            <ChevronDown className="relative w-3.5 h-3.5 text-[#4DA6FF]" strokeWidth={1.6} />
            {/* tick marks */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1 bg-[#00A3FF]/60" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-1 bg-[#00A3FF]/60" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-px w-1 bg-[#00A3FF]/60" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-px w-1 bg-[#00A3FF]/60" />
          </span>
        </motion.a>
      </motion.div>
    </section>
  );
}

/** Tiny crossfade wrapper for alternating text */
function AnimatePresenceLite({ k, children }: { k: number; children: React.ReactNode }) {
  return (
    <motion.span
      key={k}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block"
    >
      {children}
    </motion.span>
  );
}

/* ---------- Compañía ---------- */
function Compania() {
  return (
    <section id="operaciones" className="relative py-14 md:py-20 px-6 md:px-12 bg-black overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(0,163,255,0.06),transparent_55%)]" />
      <div className="relative max-w-[1280px] mx-auto grid md:grid-cols-12 gap-10 md:gap-14 items-center">
        <Reveal className="md:col-span-5">
          <div className="relative h-[540px] sm:h-[600px] md:h-[660px] w-full max-w-[520px] mx-auto md:max-w-none overflow-hidden group">
            <motion.img
              src={operacionIzaje}
              alt="SECOIVSA — izaje y montaje de tanque industrial con grúas en planta Altamira"
              className="absolute inset-0 w-full h-full object-contain md:object-cover object-center bg-black"
              style={{ filter: "brightness(1.1) contrast(1.06) saturate(1.05)" }}
              initial={{ scale: 1.0 }}
              animate={{ scale: 1.04 }}
              transition={{ duration: 16, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
              loading="lazy"
            />

            {/* Cinematic overlays — light touch */}
            <div className="absolute inset-0 bg-black/[0.22]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#00A3FF]/10 via-transparent to-black/20 mix-blend-overlay" />
            <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_50%_100%,rgba(0,163,255,0.22),transparent_65%)] opacity-70" />
            {/* Technical frame */}
            <div className="absolute inset-3 border border-[#00A3FF]/20 pointer-events-none">
              <span className="absolute -top-px -left-px w-4 h-4 border-t border-l border-[#00A3FF]/70" />
              <span className="absolute -top-px -right-px w-4 h-4 border-t border-r border-[#00A3FF]/70" />
              <span className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-[#00A3FF]/70" />
              <span className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-[#00A3FF]/70" />
            </div>
            <div className="absolute top-5 left-5 px-3 py-1 rounded-full border border-white/15 bg-black/55 backdrop-blur font-mono text-[9.5px] tracking-[0.28em] uppercase text-white/90 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#00A3FF] live-dot" />
              Altamira · TAM
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/70">
                Izaje · Montaje crítico
              </div>
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#00A3FF]/90">
                REC · 0036
              </div>
            </div>
          </div>
        </Reveal>

        <div className="md:col-span-7">
          <Reveal><Eyebrow>Operación Industrial</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2
              className="font-display text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase"
              style={{ fontSize: "clamp(1.85rem, 4.2vw, 3.25rem)" }}
            >
              Operación{" "}
              <span className="bg-gradient-to-r from-[#00A3FF] to-white bg-clip-text text-transparent">
                Industrial
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-white/70 text-[14.5px] max-w-[58ch]" style={{ lineHeight: 1.55 }}>
              Infraestructura, mantenimiento y ejecución industrial bajo
              estándares de precisión técnica, seguridad y control operativo
              digital.
            </p>
          </Reveal>

          <Reveal delay={0.25} className="mt-8 flex flex-wrap gap-2">
            {["Infraestructura Industrial", "Operación Crítica", "Montaje y Fabricación"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center justify-center min-h-[30px] px-3.5 py-1.5 border border-white/[0.09] bg-white/[0.02] font-mono text-[9.5px] tracking-[0.28em] uppercase text-white/70 transition-all duration-300 hover:border-[#00A3FF]/40 hover:text-white hover:bg-[#00A3FF]/[0.04] hover:shadow-[0_0_24px_-6px_rgba(0,163,255,0.45)]"
              >
                {t}
              </span>
            ))}
          </Reveal>

          <Reveal delay={0.3} className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.08] border border-white/[0.08]">
            {[
              { v: 22, s: "+", l: "Años operando en México" },
              { v: 300, s: "+", l: "Proyectos industriales ejecutados" },
              { v: 40, s: "+", l: "Clientes estratégicos" },
              { v: 100, s: "%", l: "Control digital operativo" },
            ].map((it) => (
              <div key={it.l} className="group relative bg-black p-5 md:p-6 flex flex-col justify-between min-h-[120px]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF]/70 transition-all duration-700" />
                <div
                  className="font-cod text-white text-[34px] md:text-[40px] font-semibold leading-none"
                  style={{ letterSpacing: "-0.035em", textShadow: "0 0 24px rgba(255,255,255,0.18)" }}
                >
                  <Counter value={it.v} suffix={it.s} />
                </div>
                <div className="mt-3 font-mono text-[9.5px] tracking-[0.24em] uppercase text-white/50 leading-snug">
                  {it.l}
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}


/* ---------- Desarrollo Humano ---------- */
const DESARROLLO = [
  { num: "01", icon: IdCard, title: "Onboarding", desc: "Integración estructurada al ecosistema operativo SECOIVSA." },
  { num: "02", icon: GraduationCap, title: "Capacitación Técnica", desc: "Programas continuos de especialización industrial certificada." },
  { num: "03", icon: HardHat, title: "Seguridad Industrial", desc: "Cultura HSE, permisos y protocolos para entornos críticos." },
  { num: "04", icon: Users, title: "Cultura Organizacional", desc: "Valores operativos, liderazgo y desempeño industrial." },
  { num: "05", icon: BadgeCheck, title: "Certificaciones", desc: "Acreditaciones técnicas alineadas a estándares internacionales." },
  { num: "06", icon: TrendingUp, title: "Desarrollo de Carrera", desc: "Crecimiento operativo y técnico de largo plazo." },
];

function DesarrolloHumano() {
  return (
    <section id="talento" className="relative py-14 md:py-20 px-6 md:px-12 bg-[#030507] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(0,163,255,0.06),transparent_55%)]" />
      <div className="relative max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-10 md:mb-14">
          <Reveal className="md:col-span-7">
            <Eyebrow>Cultura Operativa</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[50px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
              Cultura<br />
              <span className="text-white/45">operativa.</span>
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5 self-end" delay={0.15}>
            <p className="text-white/55 text-[14.5px] leading-relaxed">
              Pipeline operativo de formación, seguridad y crecimiento técnico —
              un sistema continuo, no un programa estático.
            </p>
          </Reveal>
        </div>

        {/* Métricas de cultura */}
        <Reveal>
          <div className="grid grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] mb-8 md:mb-10">
            {[
              { v: "+180", l: "Colaboradores operativos" },
              { v: "98%", l: "Capacitación activa" },
              { v: "0", l: "Incidentes críticos" },
            ].map((m) => (
              <div key={m.l} className="group relative bg-black p-5 md:p-6 text-center">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF]/70 transition-all duration-700" />
                <div className="font-cod text-white text-2xl md:text-[32px] font-semibold tracking-tight tabular-nums">{m.v}</div>
                <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.24em] uppercase text-white/45">{m.l}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Ruta operativa — workflow */}
        <div className="relative">
          {/* línea conectora vertical */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#00A3FF]/25 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-x-16 md:gap-y-4">
            {DESARROLLO.map((it, i) => {
              const Icon = it.icon;
              const right = i % 2 === 1;
              return (
                <Reveal
                  key={it.num}
                  delay={i * 0.06}
                  className={right ? "md:col-start-2" : ""}
                >
                  <div className="group relative bg-[#070a0f] border border-white/[0.06] hover:border-[#00A3FF]/30 transition-all duration-500 overflow-hidden">
                    {/* glow superior */}
                    <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/40 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
                    <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_0%_50%,rgba(0,163,255,0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    {/* nodo conector (desktop) */}
                    <span
                      className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00A3FF]/70 shadow-[0_0_10px_#00A3FF] ${right ? "-left-[33px]" : "-right-[33px]"}`}
                    />

                    <div className="relative p-5 md:p-6 flex items-start gap-4">
                      <div className="shrink-0 w-11 h-11 border border-white/[0.08] flex items-center justify-center bg-black/40 group-hover:border-[#00A3FF]/40 transition-colors">
                        <Icon className="w-5 h-5 text-white/75 group-hover:text-[#00A3FF] transition-colors" strokeWidth={1.3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-[#00A3FF]/80">{it.num}</span>
                          <span className="h-px flex-1 bg-white/[0.06]" />
                          <span className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-white/30">Module</span>
                        </div>
                        <h3 className="font-display text-[15.5px] md:text-[16.5px] text-white tracking-tight uppercase leading-tight">{it.title}</h3>
                        <p className="mt-1.5 text-[12.5px] text-white/60 leading-relaxed">{it.desc}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}



/* ---------- Filosofía Operativa ---------- */
const VALORES = [
  "Experiencia",
  "Eficiencia",
  "Innovación",
  "Respeto",
  "Responsabilidad",
  "Integridad",
];

const INTRO_PARRAFOS = [
  "El éxito de una organización no se mide por la magnitud de sus proyectos, sino por la solidez de los principios que la sostienen.",
  "Nuestros valores son el cimiento de la confianza, la credibilidad y las relaciones duraderas con clientes, colaboradores y aliados estratégicos.",
  "No son declaraciones escritas: son la guía que orienta cada decisión, la forma en la que trabajamos y el compromiso que asumimos en cada proyecto.",
  "Fortalecen nuestra identidad corporativa y representan un compromiso constante con el desarrollo de nuestra gente, la comunidad y la transformación industrial de México.",
];

function Filosofia() {
  const paneles = [
    {
      num: "01",
      tag: "Misión",
      icon: Target,
      body: "Brindamos soluciones integrales en construcción, mantenimiento, montaje y fabricación industrial, ejecutando proyectos con altos estándares de calidad, seguridad y eficiencia.",
      foot: "Superar las expectativas de nuestros clientes, aportar valor a sus operaciones y contribuir al desarrollo sostenible del sector industrial en México.",
    },
    {
      num: "02",
      tag: "Visión",
      icon: Eye,
      body: "Ser una empresa industrial líder y el aliado estratégico preferido en proyectos de construcción, montaje y mantenimiento.",
      foot: "Reconocida por la excelencia técnica, la innovación, la seguridad y el estricto cumplimiento de estándares nacionales e internacionales.",
    },
  ];

  return (
    <section id="filosofia" className="relative py-14 md:py-20 px-6 md:px-12 bg-black overflow-hidden">
      {/* fondo HUD sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(0,163,255,0.10),transparent_70%)] blur-3xl" />

      <div className="relative max-w-[1480px] mx-auto">
        {/* header */}
        <div className="grid md:grid-cols-12 gap-8 mb-10 md:mb-14">
          <Reveal className="md:col-span-7">
            <Eyebrow>Filosofía Operativa</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[54px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
              Principios<br />
              <span className="text-white/45">en operación.</span>
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5 self-end" delay={0.15}>
            <p className="text-white/55 text-[14.5px] leading-relaxed">
              La identidad SECOIVSA se construye sobre principios sólidos:
              experiencia, disciplina operativa y evolución tecnológica
              aplicadas a cada proyecto industrial.
            </p>
          </Reveal>
        </div>

        {/* introducción — manifiesto */}
        <Reveal>
          <div className="relative bg-[#070a0f] border border-white/[0.06] overflow-hidden mb-10 md:mb-14">
            <span className="absolute top-0 left-0 w-3 h-px bg-[#00A3FF]/60" />
            <span className="absolute top-0 left-0 w-px h-3 bg-[#00A3FF]/60" />
            <span className="absolute top-0 right-0 w-3 h-px bg-[#00A3FF]/60" />
            <span className="absolute top-0 right-0 w-px h-3 bg-[#00A3FF]/60" />
            <span className="absolute bottom-0 left-0 w-3 h-px bg-white/30" />
            <span className="absolute bottom-0 left-0 w-px h-3 bg-white/30" />
            <span className="absolute bottom-0 right-0 w-3 h-px bg-white/30" />
            <span className="absolute bottom-0 right-0 w-px h-3 bg-white/30" />
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/45 to-transparent" />
            <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_0%_0%,rgba(0,163,255,0.10),transparent_55%)]" />

            <div className="relative p-7 md:p-12 grid md:grid-cols-12 gap-8 md:gap-10">
              <div className="md:col-span-4">
                <p className="font-mono text-[10px] tracking-[0.32em] text-[#00A3FF]/85 uppercase mb-3">Manifiesto · 00</p>
                <h3 className="font-display text-[22px] md:text-[28px] text-white font-medium tracking-tight uppercase leading-[1.1]">
                  Identidad<br />corporativa.
                </h3>
                <div className="mt-5 h-px w-12 bg-[#00A3FF]/60" />
              </div>
              <div className="md:col-span-8 space-y-5 md:space-y-6">
                {INTRO_PARRAFOS.map((p, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? "font-display text-white/95 text-[16px] md:text-[19px] leading-[1.45] tracking-tight"
                        : "text-white/65 text-[13.5px] md:text-[14.5px] leading-relaxed"
                    }
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* paneles Misión / Visión */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-10 md:mb-14">
          {paneles.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.num} delay={i * 0.1}>
                <div className="group relative h-full min-h-[300px] md:min-h-[340px] bg-[#070a0f] border border-white/[0.06] overflow-hidden">
                  {/* corner ticks */}
                  <span className="absolute top-0 left-0 w-3 h-px bg-[#00A3FF]/60" />
                  <span className="absolute top-0 left-0 w-px h-3 bg-[#00A3FF]/60" />
                  <span className="absolute top-0 right-0 w-3 h-px bg-[#00A3FF]/60" />
                  <span className="absolute top-0 right-0 w-px h-3 bg-[#00A3FF]/60" />
                  <span className="absolute bottom-0 left-0 w-3 h-px bg-white/30" />
                  <span className="absolute bottom-0 left-0 w-px h-3 bg-white/30" />
                  <span className="absolute bottom-0 right-0 w-3 h-px bg-white/30" />
                  <span className="absolute bottom-0 right-0 w-px h-3 bg-white/30" />

                  {/* glow hover */}
                  <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_50%_0%,rgba(0,163,255,0.18),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF]/70 transition-all duration-700" />

                  <div className="relative h-full p-7 md:p-9 flex flex-col justify-between gap-8">
                    <div className="flex items-start justify-between">
                      <Icon className="w-6 h-6 text-white/70 group-hover:text-[#00A3FF] transition-colors duration-500" strokeWidth={1.2} />
                      <span className="font-mono text-[9.5px] tracking-[0.3em] text-white/35">{p.num} / 03</span>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.32em] text-[#00A3FF]/80 uppercase mb-3">{p.tag}</p>
                      <p className="font-display text-[17px] md:text-[20px] leading-[1.3] text-white/90 font-medium tracking-tight">
                        {p.body}
                      </p>
                      <div className="mt-4 pt-4 border-t border-white/[0.06]">
                        <p className="text-white/55 text-[13px] md:text-[13.5px] leading-relaxed">
                          {p.foot}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* panel Valores */}
        <Reveal delay={0.2}>
          <div className="group relative bg-[#070a0f] border border-white/[0.06] overflow-hidden">
            <span className="absolute top-0 left-0 w-3 h-px bg-[#00A3FF]/70" />
            <span className="absolute top-0 left-0 w-px h-3 bg-[#00A3FF]/70" />
            <span className="absolute top-0 right-0 w-3 h-px bg-[#00A3FF]/70" />
            <span className="absolute top-0 right-0 w-px h-3 bg-[#00A3FF]/70" />
            <span className="absolute bottom-0 left-0 w-3 h-px bg-white/30" />
            <span className="absolute bottom-0 left-0 w-px h-3 bg-white/30" />
            <span className="absolute bottom-0 right-0 w-3 h-px bg-white/30" />
            <span className="absolute bottom-0 right-0 w-px h-3 bg-white/30" />

            <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_100%_50%,rgba(255,107,0,0.10),transparent_60%)]" />

            <div className="relative p-7 md:p-10 grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4">
                <div className="flex items-center gap-3 mb-3">
                  <Gem className="w-5 h-5 text-white/70" strokeWidth={1.2} />
                  <span className="font-mono text-[9.5px] tracking-[0.3em] text-white/35">03 / 03</span>
                </div>
                <p className="font-mono text-[10px] tracking-[0.32em] text-[#00A3FF]/85 uppercase mb-2">Valores</p>
                <h3 className="font-display text-[22px] md:text-[26px] text-white font-medium tracking-tight uppercase">
                  Valores<br />operativos.
                </h3>
              </div>

              <div className="md:col-span-8">
                <div className="flex flex-wrap gap-2 md:gap-2.5">
                  {VALORES.map((v, i) => (
                    <motion.span
                      key={v}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="group/badge relative inline-flex items-center gap-2 px-3.5 md:px-4 py-2 md:py-2.5 border border-white/[0.08] bg-white/[0.02] text-white/85 hover:text-white hover:border-[#00A3FF]/50 hover:bg-[#00A3FF]/[0.06] transition-all duration-500"
                    >
                      <span className="font-mono text-[9px] tracking-[0.3em] text-white/35 group-hover/badge:text-[#00A3FF] transition-colors">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-[12.5px] md:text-[13.5px] tracking-[0.08em] uppercase">
                        {v}
                      </span>
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ---------- Capacidades (Bento) ---------- */
const CAPACIDADES = [
  { num: "01", icon: Flame, title: "Soldadura y Pailería", tag: "Operación Activa", status: "SYS ACTIVE", desc: "Procesos certificados de soldadura estructural y pailería para entornos industriales críticos.", img: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-3 md:row-span-2" },
  { num: "02", icon: Hammer, title: "Fabricación y Montaje", tag: "COD Linked", status: "TRACE ONLINE", desc: "Fabricación de estructuras, recipientes y montaje industrial bajo norma.", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-3" },
  { num: "03", icon: Construction, title: "Maniobras Industriales", tag: "Industrial System", status: "HSE READY", desc: "Izajes, traslados y maniobras de equipos pesados con planeación HSE.", img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-3" },
  { num: "04", icon: Building2, title: "Obra Civil", tag: "Operación Activa", status: "SYS ACTIVE", desc: "Cimentaciones, estructuras y obra civil industrial de alta exigencia.", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-2" },
  { num: "05", icon: SprayCan, title: "Sistemas de Pintura", tag: "Industrial System", status: "TRACE ONLINE", desc: "Recubrimientos industriales, sandblast y protección anticorrosiva.", img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-2" },
  { num: "06", icon: Wrench, title: "Mantenimiento Industrial", tag: "COD Linked", status: "COD LINKED", desc: "Mantenimiento preventivo y correctivo en planta con trazabilidad digital.", img: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1600&auto=format&fit=crop&q=80", span: "md:col-span-2" },
];



function Capacidades() {
  return (
    <section id="capacidades" className="relative py-14 md:py-20 px-6 md:px-12 bg-black">
      <div className="max-w-[1480px] mx-auto">
        <div className="grid md:grid-cols-12 gap-8 mb-10 md:mb-14">
          <Reveal className="md:col-span-7">
            <Eyebrow>Capacidades Operativas</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[54px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
              Capacidades<br />
              <span className="text-white/45">operativas.</span>
            </h2>
          </Reveal>
          <Reveal className="md:col-span-5 self-end" delay={0.15}>
            <p className="text-white/55 text-[14.5px] leading-relaxed">
              Soluciones industriales ejecutadas bajo estándares de calidad,
              seguridad y operación digital.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 md:auto-rows-[240px] gap-3 md:gap-3.5">
          {CAPACIDADES.map((s, i) => {
            const Icon = s.icon;
            const featured = i === 0;
            const centered = i === 2;
            return (
              <Reveal key={s.num} delay={(i % 3) * 0.08} className={s.span}>
                <div className="group relative h-full min-h-[240px] overflow-hidden bg-[#080b10] cursor-pointer border border-[#00A3FF]/[0.10] hover:border-[#00A3FF]/30 hover:shadow-[0_0_24px_-6px_rgba(0,140,255,0.25)] transition-all duration-500">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-[1500ms]"
                    style={{ filter: "contrast(1.08) brightness(0.78) saturate(0.95)" }}
                  />
                  {/* overlay cinematográfico */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/5" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,163,255,0.10),transparent_60%)]" />
                  <div className="pointer-events-none absolute -inset-px bg-[radial-gradient(circle_at_50%_100%,rgba(0,163,255,0.25),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
                  {/* scan line sutil */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/70 to-transparent animate-scan" />
                  </div>

                  {/* OPS module header */}
                  <div className="absolute top-0 inset-x-0 px-5 md:px-6 py-3 flex items-center justify-between font-mono text-[8.5px] tracking-[0.3em] uppercase">
                    <span className="text-[#00A3FF]/85">OPS MODULE — {s.num}</span>
                    <span className="flex items-center gap-1.5 text-white/55">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] live-dot" />
                      {s.status}
                    </span>
                  </div>

                  <div className={`relative h-full p-6 md:p-7 pt-12 flex flex-col ${centered ? "justify-center items-center text-center" : featured ? "justify-end" : "justify-between"}`}>
                    {!centered && !featured && (
                      <div className="flex items-start justify-end">
                        <Icon className="w-7 h-7 text-white/85 group-hover:text-[#00A3FF] transition-colors duration-500 drop-shadow-[0_0_10px_rgba(0,163,255,0.4)]" strokeWidth={1.3} />
                      </div>
                    )}
                    <div className={centered ? "max-w-xs" : ""}>
                      {centered && (
                        <Icon className="w-9 h-9 text-[#00A3FF] mx-auto mb-3 drop-shadow-[0_0_12px_rgba(0,163,255,0.5)]" strokeWidth={1.3} />
                      )}
                      {featured && (
                        <Icon className="w-8 h-8 text-[#00A3FF] mb-4 drop-shadow-[0_0_12px_rgba(0,163,255,0.5)]" strokeWidth={1.3} />
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#00A3FF]/30 bg-[#00A3FF]/[0.08] backdrop-blur-sm font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#00A3FF] mb-3">
                        <span className="w-1 h-1 rounded-full bg-[#00A3FF] shadow-[0_0_6px_#00A3FF] live-dot" />
                        {s.tag}
                      </span>
                      <h3 className={`font-display text-white font-medium tracking-tight uppercase ${featured ? "text-[24px] md:text-[28px]" : "text-[18px] md:text-[20px]"}`}>{s.title}</h3>
                      <p className="mt-2 text-[12.5px] md:text-[13px] text-white/74 leading-relaxed max-w-md">{s.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Proyectos ---------- */
function Proyectos() {
  const main = {
    img: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1900&auto=format&fit=crop&q=80",
    tag: "Petroquímica",
    title: "Montaje y fabricación industrial en planta Altamira",
    loc: "Altamira, Tamps.",
    progress: 92,
    status: "ACTIVE SITE",
  };
  const side = [
    { img: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1400&auto=format&fit=crop&q=80", tag: "Estructura", title: "Estructuras metálicas a gran escala", loc: "Monterrey, NL", progress: 78, status: "COD LINKED" },
    { img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1400&auto=format&fit=crop&q=80", tag: "Mantenimiento", title: "Modernización de activos industriales", loc: "Coatzacoalcos, Ver.", progress: 64, status: "HSE VERIFIED" },
  ];

  const Chip = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md border border-[#00A3FF]/25 font-mono text-[8.5px] tracking-[0.26em] uppercase text-white/90 shadow-[inset_0_0_12px_rgba(0,163,255,0.08)]">
      {children}
    </span>
  );

  return (
    <section id="proyectos" className="relative py-14 md:py-20 px-6 md:px-12 bg-[#030507]">
      <div className="max-w-[1480px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <Reveal>
            <Eyebrow>Proyectos en Ejecución</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl lg:text-[54px] text-white font-medium tracking-[-0.01em] leading-[1.05] max-w-2xl uppercase">
              Proyectos en<br />
              <span className="text-white/45">ejecución.</span>
            </h2>
            <p className="mt-5 text-white/55 text-[14px] leading-relaxed max-w-xl">
              Infraestructura industrial desarrollada con precisión, seguridad y
              control operativo en tiempo real.
            </p>
          </Reveal>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Reveal className="lg:col-span-2">
            <a href="#contacto" className="group relative block aspect-[16/10] overflow-hidden bg-[#080b10] border border-[#00A3FF]/[0.10] hover:border-[#00A3FF]/30 transition-all duration-500">
              <img src={main.img} alt={main.title}
                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-[1800ms]"
                style={{ filter: "contrast(1.1) brightness(0.92) saturate(1.0)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,163,255,0.10),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* HUD corners */}
              <span className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#00A3FF]/50" />
              <span className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#00A3FF]/50" />
              <span className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#00A3FF]/50" />
              <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#00A3FF]/50" />

              <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3 flex-wrap">
                <Chip>{main.tag}</Chip>
                <div className="flex items-center gap-2">
                  <Chip>
                    <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] live-dot" />
                    {main.status}
                  </Chip>
                  <Chip>
                    <MapPin className="w-2.5 h-2.5 text-[#00A3FF]" strokeWidth={1.8} />
                    {main.loc}
                  </Chip>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-white text-2xl md:text-3xl font-medium tracking-tight leading-tight max-w-xl uppercase">{main.title}</h3>
                <div className="mt-4 flex items-end justify-between gap-6">
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/55 mb-1.5">
                      <span>Avance</span>
                      <span className="text-[#00A3FF] font-cod tabular-nums">{main.progress}%</span>
                    </div>
                    <div className="h-px bg-white/[0.08] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00A3FF]/80 to-[#00A3FF] shadow-[0_0_8px_#00A3FF]" style={{ width: `${main.progress}%` }} />
                    </div>
                  </div>
                  <span className="shrink-0 w-10 h-10 border border-[#00A3FF]/30 bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-[#00A3FF]/15 group-hover:border-[#00A3FF]/60 group-hover:shadow-[0_0_18px_-4px_#00A3FF] transition-all">
                    <ArrowUpRight className="w-4 h-4 text-white/85 group-hover:text-[#00A3FF] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                  </span>
                </div>
              </div>
            </a>
          </Reveal>

          <div className="grid grid-rows-2 gap-4">
            {side.map((p, i) => (
              <Reveal key={p.title} delay={0.1 + i * 0.08}>
                <a href="#contacto" className="group relative block h-full min-h-[200px] overflow-hidden bg-[#080b10] border border-[#00A3FF]/[0.10] hover:border-[#00A3FF]/30 transition-all duration-500">
                  <img src={p.img} alt={p.title}
                    className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-[1500ms]"
                    style={{ filter: "contrast(1.08) brightness(0.9) saturate(0.95)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 flex-wrap">
                    <Chip>{p.tag}</Chip>
                    <Chip>
                      <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] live-dot" />
                      {p.status}
                    </Chip>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-end justify-between gap-3 mb-2.5">
                      <h3 className="font-display text-white text-[16px] font-medium leading-tight uppercase">{p.title}</h3>
                      <span className="shrink-0 w-8 h-8 border border-[#00A3FF]/30 bg-black/40 backdrop-blur-md flex items-center justify-center group-hover:bg-[#00A3FF]/15 group-hover:border-[#00A3FF]/60 transition-all">
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/85 group-hover:text-[#00A3FF] transition" />
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[8.5px] tracking-[0.26em] uppercase text-white/55 mb-1">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-2.5 h-2.5 text-[#00A3FF]" strokeWidth={1.8} />
                        {p.loc}
                      </span>
                      <span className="text-[#00A3FF] font-cod tabular-nums">{p.progress}%</span>
                    </div>
                    <div className="h-px bg-white/[0.08] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00A3FF]/70 to-[#00A3FF] shadow-[0_0_6px_#00A3FF]" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Estructura organizacional ---------- */
const ORG = ["Operaciones", "Producción", "Finanzas", "Comercial", "Recursos Humanos", "Calidad y Seguridad"];

function Estructura() {
  return (
    <section id="modelo" className="relative py-14 md:py-20 px-6 md:px-12 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,163,255,0.07),transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,163,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(0,163,255,0.7) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
        }}
      />
      <div className="relative max-w-[1180px] mx-auto">
        <Reveal className="text-center">
          <Eyebrow>Modelo Operativo</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
            Modelo operativo<br />
            <span className="text-white/45">SECOIVSA.</span>
          </h2>
          <p className="mt-5 text-white/55 text-[14px] leading-relaxed max-w-xl mx-auto">
            Estructura coordinada para ejecución, control y crecimiento operativo.
          </p>
        </Reveal>

        <div className="relative mt-16">
          <Reveal>
            <div className="mx-auto w-fit relative">
              <div className="px-10 py-6 border border-[#00A3FF]/40 bg-[#00A3FF]/[0.06] backdrop-blur-md shadow-[0_0_50px_-14px_rgba(0,163,255,0.5)]">
                <div className="font-mono text-[9.5px] tracking-[0.32em] uppercase text-[#00A3FF] mb-1.5 text-center">— Liderazgo</div>
                <div className="font-display text-white text-[18px] tracking-[0.1em] uppercase text-center">Dirección General</div>
              </div>
              <span className="absolute left-1/2 -bottom-12 w-px h-12 bg-gradient-to-b from-[#00A3FF]/60 to-transparent" />
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ORG.map((title, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="group relative h-full p-4 md:p-5 text-center border border-white/[0.07] bg-black/40 backdrop-blur-md transition-all duration-500 hover:border-[#00A3FF]/40 hover:bg-[#00A3FF]/[0.05]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF]/70 transition-all duration-700" />
                  <div className="font-mono text-[9px] tracking-[0.28em] text-white/30 mb-2">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-display text-[12.5px] tracking-[0.1em] uppercase text-white font-medium">
                    {title}
                  </h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Estándares ---------- */
const CERTS = [
  { code: "ISO 9001", label: "Gestión de calidad", icon: Award },
  { code: "ISO 14001", label: "Gestión ambiental", icon: Leaf },
  { code: "ISO 45001", label: "Seguridad y salud", icon: HardHat },
  { code: "ISO 37001", label: "Antisoborno", icon: ShieldCheck },
  { code: "REPSE", label: "STPS", icon: ShieldCheck },
];

function Estandares() {
  return (
    <section id="estandares" className="relative py-14 md:py-20 px-6 md:px-12 bg-[#030507] overflow-hidden">
      {/* blueprint grid */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,163,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(0,163,255,0.6) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,163,255,0.07),transparent_55%)]" />

      <div className="relative max-w-[1400px] mx-auto">
        <Reveal className="text-center max-w-3xl mx-auto">
          <Eyebrow>Estándares Operativos</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl lg:text-[52px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase drop-shadow-[0_0_18px_rgba(0,163,255,0.15)]">
            Estándares <span className="text-gradient-brand">operativos.</span>
          </h2>
          <p className="mt-5 text-white/60 text-[14px] leading-relaxed">
            Cumplimiento industrial verificado · Sistemas activos del ecosistema SECOIVSA.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
          {CERTS.map((c, i) => {
            const Icon = c.icon;
            const isLast = i === CERTS.length - 1;
            return (
              <Reveal key={c.code} delay={i * 0.07} className={isLast ? "col-span-2 md:col-span-4" : ""}>
                <div className={`group relative bg-black h-full transition-all duration-500 hover:bg-[#080b10] hover:shadow-[inset_0_0_30px_rgba(0,163,255,0.08)] ${isLast ? "p-7 md:p-8 flex flex-col md:flex-row items-center md:justify-center gap-4 md:gap-6 text-center" : "p-6 md:p-7 flex flex-col items-center text-center"}`}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/0 to-transparent group-hover:via-[#00A3FF] transition-all duration-700" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,163,255,0.18),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <span className="absolute top-2 right-2 font-mono text-[8px] tracking-[0.28em] text-[#00A3FF]/0 group-hover:text-[#00A3FF]/80 transition-colors">ACTIVE</span>

                  <div className={`relative ${isLast ? "w-12 h-12 md:w-14 md:h-14" : "w-12 h-12"} flex items-center justify-center border border-[#00A3FF]/15 group-hover:border-[#00A3FF]/40 bg-[#00A3FF]/[0.04] group-hover:shadow-[0_0_20px_-4px_rgba(0,163,255,0.4)] transition-all duration-500`}>
                    <Icon className="w-6 h-6 text-white/75 group-hover:text-[#00A3FF] transition-colors drop-shadow-[0_0_8px_rgba(0,163,255,0.35)]" strokeWidth={1.5} />
                  </div>
                  <div className={isLast ? "md:text-left" : "mt-4"}>
                    <div className={`font-display text-white tracking-[0.06em] uppercase ${isLast ? "text-[20px] md:text-[22px]" : "text-[16px]"}`}>{c.code}</div>
                    <div className={`mt-1 font-mono tracking-[0.24em] uppercase text-white/55 ${isLast ? "text-[10px]" : "text-[9.5px]"}`}>{c.label}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contacto ---------- */
function Contacto() {
  return (
    <section id="contacto" className="relative py-16 md:py-24 px-6 md:px-12 bg-[#030507] overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,163,255,0.10),transparent_60%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,163,255,0.18),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-[760px] mx-auto text-center">
        <Reveal><Eyebrow>Contacto Operativo</Eyebrow></Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-3 font-display text-3xl md:text-5xl lg:text-[52px] text-white font-medium tracking-[-0.01em] leading-[1.05] uppercase">
            Contacto{" "}
            <span className="bg-gradient-to-r from-[#00A3FF] to-white bg-clip-text text-transparent">
              operativo.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-5 text-white/60 text-[14px] md:text-[14.5px] max-w-[56ch] mx-auto" style={{ lineHeight: 1.6 }}>
            Coordinación directa para proyectos industriales, montaje,
            mantenimiento y operación técnica especializada.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative mt-10 md:mt-12 p-6 md:p-8 border border-white/[0.07] bg-white/[0.015] backdrop-blur-md text-left"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/20 to-transparent" />
            <span className="absolute -top-px -left-px w-3 h-3 border-t border-l border-[#00A3FF]/60" />
            <span className="absolute -top-px -right-px w-3 h-3 border-t border-r border-[#00A3FF]/60" />
            <span className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-[#00A3FF]/60" />
            <span className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-[#00A3FF]/60" />

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Nombre" name="nombre" />
              <Field label="Empresa" name="empresa" />
              <Field label="Correo" name="correo" type="email" />
              <Field label="Teléfono" name="telefono" type="tel" />
              <div className="sm:col-span-2">
                <label className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-white/50 mb-2 block">
                  Proyecto / Mensaje
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-transparent border-b border-white/12 focus:border-[#00A3FF] outline-none py-2.5 text-[14px] text-white placeholder-white/25 transition-colors resize-none"
                  placeholder="Cuéntanos sobre tu proyecto industrial…"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                className="group relative inline-flex items-center gap-2.5 px-7 py-3 bg-[#0a0d12] border border-[#00A3FF]/40 text-white text-[11px] tracking-[0.24em] uppercase font-medium transition-all duration-300 hover:border-[#00A3FF] hover:bg-[#00A3FF]/[0.06] hover:shadow-[0_0_32px_-4px_rgba(0,163,255,0.55)]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_10px_#00A3FF]" />
                Enviar mensaje
                <Send className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}


function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <div>
      <label className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-white/50 mb-2 block">{label}</label>
      <input
        type={type}
        name={name}
        className="w-full bg-transparent border-b border-white/15 focus:border-[#00A3FF] outline-none py-2.5 text-[14px] text-white placeholder-white/30 transition-colors"
      />
    </div>
  );
}

/* ---------- Page ---------- */
function Landing() {
  return (
    <div className="relative bg-[#030507] text-white min-h-screen overflow-x-hidden">
      <AmbientFx />
      <SmoothScroll />
      <CustomCursor />
      <SiteHeader />
      <main className="relative z-[2]">
        <Hero />
        <Compania />
        <Estructura />
        <Filosofia />
        <DesarrolloHumano />
        <Capacidades />
        <CODShowcase />
        <Estandares />
        <ClientsGrid />
        <Proyectos />
        <Contacto />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <ScrollTop />
    </div>
  );
}
