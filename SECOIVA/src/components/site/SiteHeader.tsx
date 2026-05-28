import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { WeatherTime } from "./WeatherTime";
import wordmark from "@/assets/secoivsa-logo.png";

type NavItem = {
  href: string;
  label: string;
  short?: string;
  sub: string;
  noTranslate?: boolean;
};

const NAV: NavItem[] = [
  { href: "#operaciones", label: "Operación Industrial",        short: "Operación",   sub: "Industrial Execution" },
  { href: "#filosofia",   label: "Filosofía Operativa",         short: "Filosofía",   sub: "Mission · Vision · Values" },
  { href: "#capacidades", label: "Capacidades Operativas",      short: "Capacidades", sub: "Engineering Systems" },
  { href: "#cod",         label: "Centro de Operación Digital", short: "COD",         sub: "Digital Operations Center", noTranslate: true },
  { href: "#estandares",  label: "Estándares Operativos",       short: "Estándares",  sub: "Safety & Quality Systems" },
  { href: "#alianzas",    label: "Alianzas Estratégicas",       short: "Alianzas",    sub: "Strategic Partners" },
  { href: "#proyectos",   label: "Proyectos en Ejecución",      short: "Proyectos",   sub: "Operational Infrastructure" },
  { href: "#contacto",    label: "Contacto Operativo",          short: "Contacto",    sub: "Operational Communication" },
];

/** Menu top HUD — location · weather · date (live) */
function MenuHud() {
  const [now, setNow] = useState<Date | null>(null);
  const [w, setW] = useState<{ temp: number; hum: number } | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=22.4&longitude=-97.92&current=temperature_2m,relative_humidity_2m&timezone=America%2FMexico_City"
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const c = d?.current;
        if (c) setW({ temp: Math.round(c.temperature_2m), hum: Math.round(c.relative_humidity_2m) });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const date = now
    ? now.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Mexico_City" })
        .replace(/\./g, "")
        .toUpperCase()
    : "—";

  return (
    <div className="font-mono text-white/85 leading-tight">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.42em] uppercase text-white/55">
        <span className="w-1 h-1 rounded-full bg-[#00A3FF] shadow-[0_0_6px_#00A3FF]" />
        Altamira, Tamaulipas
      </div>
      <div className="mt-1.5 flex items-baseline gap-2 text-[12.5px] tracking-[0.18em] tabular-nums text-white">
        <span>{w ? `${w.temp}°C` : "—°C"}</span>
        <span className="text-white/30">·</span>
        <span className="text-white/70 text-[10px]">Humedad {w ? `${w.hum}%` : "—%"}</span>
      </div>
      <div className="mt-1 text-[8.5px] tracking-[0.42em] uppercase text-white/40 tabular-nums">
        {date}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // lock body scroll while drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Force iOS Safari to autoplay the menu video on open
  useEffect(() => {
    if (!open) return;
    const v = menuVideoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => { v.play().catch(() => {}); };
    tryPlay();
    const id = window.setTimeout(tryPlay, 120);
    const onTouch = () => tryPlay();
    document.addEventListener("touchstart", onTouch, { once: true, passive: true });
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("touchstart", onTouch);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
          scrolled
            ? "bg-[#030507]/92 border-b border-white/[0.06] shadow-[0_8px_24px_-14px_rgba(0,0,0,0.75)]"
            : "bg-gradient-to-b from-black/55 via-black/25 to-transparent"
        }`}
      >
        <div
          className={`relative max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 lg:px-10 xl:px-14 flex items-center justify-between lg:grid lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:gap-6 xl:gap-8 transition-all duration-500 ${
            scrolled
              ? "h-[54px] md:h-[60px] lg:h-[64px]"
              : "h-[60px] md:h-[68px] lg:h-[72px]"
          }`}
        >
          {/* Logo — left */}
          <a href="#top" className="group relative flex items-center shrink-0 h-full lg:justify-self-start">
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              src={wordmark}
              alt="SECOIVSA — Construcción Industrial"
              className={`relative block w-auto select-none transition-all duration-500 ${
                scrolled
                  ? "h-[80px] md:h-[96px] lg:h-[60px]"
                  : "h-[92px] md:h-[108px] lg:h-[68px]"
              }`}
              style={{ filter: "brightness(0) invert(1)" }}
              draggable={false}
            />
            <span className="sr-only">SECOIVSA</span>
          </a>

          {/* Nav — center column */}
          <nav className="hidden lg:flex h-full items-center justify-center gap-4 xl:gap-5 min-w-0 max-w-[620px] xl:max-w-[680px] mx-auto w-full">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                {...(n.noTranslate ? { translate: "no" as const } : {})}
                className="group relative inline-flex items-center h-full py-1 text-[10.5px] tracking-[0.22em] uppercase text-white/60 transition-all duration-[400ms] hover:text-[#4DA6FF] whitespace-nowrap"
                style={{ textShadow: "0 0 0 transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.textShadow = "0 0 12px #4DA6FF")}
                onMouseLeave={(e) => (e.currentTarget.style.textShadow = "0 0 0 transparent")}
              >
                {n.short ?? n.label}
                <span className="pointer-events-none absolute left-0 bottom-2 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-transparent via-[#4DA6FF] to-transparent transition-transform duration-500 group-hover:scale-x-100 shadow-[0_0_8px_#4DA6FF]" />
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="flex h-full items-center gap-3 md:gap-5 lg:gap-6 xl:gap-7 shrink-0 lg:justify-self-end">
            <div className="hidden sm:flex items-center h-full">
              <WeatherTime />
            </div>
            <Link
              to="/login"
              className="hidden md:inline-flex items-center gap-1.5 text-[9px] tracking-[0.2em] uppercase text-white/80 hover:text-white transition-colors group whitespace-nowrap"
            >
              <span className="w-1 h-1 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
              <span translate="no">Acceso COD</span>
              <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <button
              aria-label="Menú"
              onClick={() => setOpen(true)}
              className="lg:hidden relative w-10 h-10 grid place-items-center text-white/90 hover:text-white border border-white/10 hover:border-[#00A3FF]/40 bg-black/80 rounded-full transition-colors"
            >
              <Menu className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>


        <div
          className={`absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-[#00A3FF]/50 to-transparent transition-opacity duration-700 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </header>

      {/* Mobile drawer — cinematic premium */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] bg-black lg:hidden">
            {/* Immediate black backdrop — no white/gray flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute inset-0 bg-black"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0.96 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full bg-black border-l border-white/[0.06] overflow-hidden flex flex-col"
            >
              {/* Industrial grid (subtle) */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(125,199,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(125,199,255,0.8) 1px,transparent 1px)",
                  backgroundSize: "72px 72px",
                }}
              />
              {/* Ambient glow — static and lightweight */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle_at_top_right,rgba(0,163,255,0.12),transparent_70%)] pointer-events-none" />
              {/* Vertical accent line */}
              <div className="absolute left-0 top-[18%] bottom-[14%] w-px bg-gradient-to-b from-transparent via-[#00A3FF]/25 to-transparent" />

              {/* Top bar */}
              <div className="relative flex items-center justify-between px-6 pt-4 pb-2 h-[72px] shrink-0 z-10">
                <img
                  src={wordmark}
                  alt="SECOIVSA"
                  className="h-[58px] w-auto select-none"
                  style={{ filter: "brightness(0) invert(1)" }}
                  draggable={false}
                />
                <button
                  aria-label="Cerrar"
                  onClick={() => setOpen(false)}
                  className="w-11 h-11 grid place-items-center text-white/85 hover:text-white border border-white/10 hover:border-[#00A3FF]/50 rounded-full bg-black transition-colors"
                >
                  <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              </div>

              {/* Cinematic HUD zone — Centro de Operación */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.04, duration: 0.18, ease: "easeOut" }}
                className="relative mx-5 mt-2 h-[176px] overflow-hidden border border-white/[0.07] bg-[#030507]"
              >
                <video
                  ref={menuVideoRef}
                  className="menu-video absolute inset-0 w-full h-full object-cover opacity-95"
                  src="/hero-drone.mp4"
                  poster="/hero-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controls={false}
                  {...({ "webkit-playsinline": "true" } as Record<string, string>)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030507] via-[#030507]/55 to-[#030507]/20" />
                {/* scan line */}
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 h-px pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(0,163,255,0.55), transparent)",
                    boxShadow: "0 0 10px rgba(0,163,255,0.45)",
                  }}
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                {/* corner ticks */}
                <span className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#00A3FF]/70" />
                <span className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#00A3FF]/70" />
                <span className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#00A3FF]/70" />
                <span className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#00A3FF]/70" />

                {/* Top: COD label + System Active */}
                <div className="absolute top-3 inset-x-4 flex items-center justify-between">
                  <div className="font-mono text-[8.5px] tracking-[0.42em] uppercase text-white/65">
                    <span translate="no">COD</span> · Op. 24/7
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[8.5px] tracking-[0.38em] uppercase text-[#00FF94]/95">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inset-0 rounded-full bg-[#00FF94] animate-ping opacity-70" />
                      <span className="relative w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_8px_#00FF94]" />
                    </span>
                    Sistema Activo
                  </div>
                </div>

                {/* Bottom: location/weather/date HUD + COD ONLINE */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <MenuHud />
                  <div className="text-right font-mono">
                    <div className="text-[8.5px] tracking-[0.4em] uppercase text-white/45">Status</div>
                    <div translate="no" className="mt-1 text-[10px] tracking-[0.32em] uppercase text-white font-medium">
                      COD Online
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Nav */}
              <nav className="relative flex-1 px-5 pt-5 pb-3 overflow-y-auto z-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.06, duration: 0.18 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <span className="h-px flex-1 bg-gradient-to-r from-[#00A3FF]/40 to-transparent" />
                  <span className="font-mono text-[8.5px] tracking-[0.45em] uppercase text-white/45">
                    Navegación
                  </span>
                </motion.div>
                <ul className="flex flex-col">
                  {NAV.map((n, i) => (
                    <motion.li
                      key={n.href}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: 0.04 + i * 0.018,
                        duration: 0.16,
                        ease: "easeOut",
                      }}
                      className="relative"
                    >
                      <a
                        href={n.href}
                        onClick={() => setOpen(false)}
                        {...(n.noTranslate ? { translate: "no" as const } : {})}
                        className="group relative flex items-center justify-between py-3 text-white/80 hover:text-white transition-colors"
                      >
                        <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                        <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 group-hover:scale-x-100 bg-gradient-to-r from-[#00A3FF]/0 via-[#00A3FF]/70 to-transparent transition-transform duration-500 shadow-[0_0_8px_rgba(0,163,255,0.5)]" />
                        <span className="flex items-center gap-4 transition-transform duration-400 group-hover:translate-x-1.5">
                          <span className="font-mono text-[9px] tracking-[0.3em] text-white/30 group-hover:text-[#00A3FF] transition-colors tabular-nums pt-0.5">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex flex-col">
                            <span className="font-display text-[15.5px] tracking-[0.16em] uppercase font-medium leading-tight">
                              {n.label}
                            </span>
                            <span className="mt-0.5 font-mono text-[8.5px] tracking-[0.32em] uppercase text-white/35 group-hover:text-white/55 transition-colors">
                              {n.sub}
                            </span>
                          </span>
                        </span>
                        <ArrowUpRight
                          className="w-3.5 h-3.5 text-white/0 group-hover:text-[#00A3FF] -translate-x-2 group-hover:translate-x-0 transition-all duration-400"
                          strokeWidth={1.6}
                        />
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Footer — slim CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.18 }}
                className="relative px-5 pb-6 pt-3 z-10"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  translate="no"
                  className="group relative flex w-full items-center justify-between px-4 py-3 text-[10px] tracking-[0.32em] uppercase text-white/90 hover:text-white border border-white/10 hover:border-[#00A3FF]/50 bg-transparent hover:bg-[#00A3FF]/[0.04] transition-all"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-1 h-1 rounded-full bg-[#00A3FF] shadow-[0_0_8px_#00A3FF]" />
                    Acceso COD
                  </span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-white/50 group-hover:text-[#00A3FF] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                    strokeWidth={1.5}
                  />
                </Link>
                <p className="mt-4 font-mono text-[8.5px] tracking-[0.4em] uppercase text-white/30 text-center">
                  SECOIVSA · Altamira, MX
                </p>
              </motion.div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
