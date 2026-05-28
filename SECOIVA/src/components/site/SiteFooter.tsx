import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Briefcase,
  Truck,
  Building2,
} from "lucide-react";


const ACCESOS: {
  label: string;
  desc: string;
  href: string;
  icon: typeof Briefcase;
}[] = [
  {
    label: "Bolsa de Trabajo",
    desc: "Vacantes · Reclutamiento · RH",
    href: "/bolsa-trabajo",
    icon: Briefcase,
  },
  {
    label: "Portal de Proveedores",
    desc: "Órdenes · Pagos · Contratos",
    href: "/proveedores",
    icon: Truck,
  },
  {
    label: "Portal Clientes",
    desc: "Proyectos · Avances · Reportes",
    href: "/clientes",
    icon: Building2,
  },
];

const LEGAL_PRIMARY: [string, string][] = [
  ["Aviso de Privacidad", "/aviso-privacidad"],
  ["Términos y Condiciones", "/terminos"],
  ["Política de Cookies", "/cookies"],
];

function LegalLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      to={href}
      className="group relative inline-flex items-center text-white/30 hover:text-white/85 transition-colors duration-500"
    >
      <span className="relative">
        {children}
        <span className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-[#00A3FF] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
      </span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer id="legal" className="relative bg-[#030507] border-t border-white/[0.06] overflow-hidden scroll-mt-24">
      {/* Top premium separator: glow line + scan beam */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00A3FF]/60 to-transparent shadow-[0_0_18px_rgba(0,163,255,0.45)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#00A3FF]/80 to-transparent animate-[footerScan_7s_linear_infinite]" />
      </div>
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] rounded-full bg-[radial-gradient(circle,rgba(0,163,255,0.07),transparent_60%)] blur-3xl pointer-events-none" />

      <style>{`
        @keyframes footerScan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes codPulse {
          0%, 100% { box-shadow: 0 0 30px -6px rgba(0,163,255,0.45), inset 0 0 24px -10px rgba(0,163,255,0.35); }
          50% { box-shadow: 0 0 48px -4px rgba(0,163,255,0.75), inset 0 0 32px -8px rgba(0,163,255,0.55); }
        }
      `}</style>

      <div className="relative max-w-[1480px] mx-auto px-6 md:px-10 pt-12 pb-16 md:pb-12">
        <div className="grid md:grid-cols-12 gap-8 md:gap-10">

          {/* Accesos Operativos */}
          <div className="md:col-span-7">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00A3FF] mb-5">
              Accesos Operativos
            </p>
            <ul className="grid sm:grid-cols-3 gap-2.5">
              {ACCESOS.map(({ label, desc, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="group relative flex items-center gap-3 p-3 h-full border border-white/[0.07] bg-white/[0.015] transition-all duration-500 ease-out
                               hover:-translate-y-0.5 hover:bg-white/[0.04] hover:border-[#00A3FF]/45
                               hover:shadow-[0_8px_30px_-12px_rgba(0,163,255,0.55)]"
                  >
                    {/* border reveal */}
                    <span className="pointer-events-none absolute inset-x-0 -bottom-px h-px scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 bg-gradient-to-r from-[#00A3FF] via-[#00A3FF]/60 to-transparent" />
                    <div className="w-9 h-9 shrink-0 grid place-items-center border border-white/10 bg-black/40 group-hover:border-[#00A3FF]/50 group-hover:shadow-[0_0_18px_-4px_#00A3FF] transition-all duration-500">
                      <Icon className="w-4 h-4 text-white/70 group-hover:text-[#00A3FF] transition-colors duration-500" strokeWidth={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white/85 group-hover:text-white transition-colors duration-500">
                        {label}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-white/40 mt-0.5 truncate">
                        {desc}
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#00A3FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* COD Access — núcleo digital operativo */}
          <div className="md:col-span-5">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#00A3FF] mb-5">
              Centro de Operación
            </p>

            <Link
              to="/login"
              className="group relative block p-5 border border-[#00A3FF]/45 bg-[radial-gradient(circle_at_30%_0%,rgba(0,163,255,0.18),transparent_70%)] hover:border-[#00A3FF]/80 transition-all duration-500 overflow-hidden animate-[codPulse_4.5s_ease-in-out_infinite]"
            >
              {/* corner accents */}
              <span className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00A3FF]/60" />
              <span className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00A3FF]/60" />

              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-[#00A3FF]/60 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_10px_#00A3FF]" />
                </span>
                <span className="font-mono text-[8.5px] tracking-[0.26em] uppercase text-white/55">
                  Online
                </span>
              </div>

              <div className="font-mono text-[9.5px] tracking-[0.3em] uppercase text-[#00A3FF]/90">
                SECOIVSA · COD
              </div>
              <div className="mt-2 flex items-center gap-2 text-white text-[16px] font-semibold tracking-wide">
                Acceso COD
                <ArrowUpRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="mt-3 font-mono text-[9px] tracking-[0.28em] uppercase text-white/50">
                Clientes • Proveedores • RH
              </div>

              {/* status bar */}
              <div className="mt-4 pt-3 border-t border-[#00A3FF]/15 flex items-center gap-2">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/50 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </span>
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-emerald-300/90">
                  COD STATUS: OPERATIONAL
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 pt-5 border-t border-white/[0.06] flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11.5px]">
            {LEGAL_PRIMARY.map(([l, h]) => (
              <LegalLink key={h} href={h}>{l}</LegalLink>
            ))}
          </div>
          <div className="text-[11.5px]">
            <LegalLink href="/cumplimiento">Cumplimiento Corporativo</LegalLink>
          </div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.32em] uppercase text-white/40 text-center">
            Infraestructura · Operación · Tecnología
          </div>
          <div className="font-mono text-[9.5px] tracking-[0.26em] uppercase text-white/25">
            © 2026 SECOIVSA
          </div>
        </div>
      </div>
    </footer>
  );
}
