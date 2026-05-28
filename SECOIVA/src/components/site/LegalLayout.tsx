import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { AmbientFx } from "./AmbientFx";
import { motion } from "motion/react";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({
  eyebrow,
  title,
  subtitle,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updated: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const handleBack = () => {
    // Always return to the legal/footer section of the home page
    router.navigate({ to: "/", hash: "legal" });
  };
  return (
    <div className="relative bg-[#030507] text-white min-h-screen overflow-hidden">
      <AmbientFx />
      {/* Technical grid background */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,163,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,163,255,0.18) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,0,0,0.9), transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(0,0,0,0.9), transparent 75%)",
        }}
      />
      {/* Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full z-[1]"
        style={{ background: "radial-gradient(circle, rgba(0,163,255,0.10), transparent 60%)" }}
      />
      <SiteHeader />

      {/* Floating back button — minimalist industrial */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-24 md:bottom-10 md:top-auto right-3 md:right-6 z-40"
      >
        <button
          type="button"
          onClick={handleBack}
          className="group relative inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full
                     border border-[#00A3FF]/20 bg-black/40 backdrop-blur-md
                     text-[#7DD3FC]/85 text-[9.5px] md:text-[10px] tracking-[0.3em] uppercase font-mono
                     transition-all duration-500 ease-out
                     hover:border-[#00A3FF]/60 hover:bg-[#00A3FF]/10 hover:text-white
                     hover:shadow-[0_0_24px_-6px_#00A3FF]"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_12px_-4px_rgba(0,163,255,0.55)]" />
          <ArrowLeft size={12} className="relative transition-transform duration-500 group-hover:-translate-x-0.5" />
          <span className="relative">Regresar</span>
        </button>
      </motion.div>


      <main className="relative z-[2] pt-32 md:pt-40 pb-28 md:pb-32 px-6 md:px-12">
        <div className="max-w-[720px] mx-auto">
          {/* Header block */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF] shadow-[0_0_12px_#00A3FF]" />
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#00A3FF]">
                SECOIVSA · {eyebrow}
              </p>
              <span className="flex-1 h-px bg-gradient-to-r from-[#00A3FF]/40 via-white/10 to-transparent" />
            </div>

            <h1 className="font-display text-[34px] md:text-[56px] text-white font-medium tracking-[-0.015em] leading-[1.02] uppercase">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-5 max-w-[640px] text-[15px] md:text-[16px] leading-relaxed text-white/55">
                {subtitle}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.26em] uppercase text-white/40">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00A3FF]/70" />
                DOC · LEGAL
              </span>
              <span>REV · {updated}</span>
              <span>ESTADO · VIGENTE</span>
            </div>

            <div className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </motion.div>

          {/* Body */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 space-y-8 text-[15px] leading-[1.85] text-white/70
                       [&_h2]:font-display [&_h2]:text-white [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-medium [&_h2]:tracking-[-0.01em] [&_h2]:uppercase [&_h2]:mt-16 [&_h2]:mb-5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3
                       [&_h2]:before:content-[''] [&_h2]:before:w-6 [&_h2]:before:h-px [&_h2]:before:bg-[#00A3FF]
                       [&_p]:text-white/65 [&_p]:leading-[1.9] [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-3 [&_ul]:text-white/65
                       [&_li]:relative [&_li]:pl-5 [&_li]:leading-[1.75] [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.7em] [&_li]:before:w-2 [&_li]:before:h-px [&_li]:before:bg-[#00A3FF]/60
                       [&_a]:text-[#00A3FF] [&_a]:underline-offset-4 hover:[&_a]:underline
                       [&_strong]:text-white/90 [&_strong]:font-medium"
          >
            {children}
          </motion.div>

          {/* Footer signature block */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 pt-8 border-t border-white/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[10px] tracking-[0.26em] uppercase text-white/40">
              <div>
                <p className="text-white/30 mb-2">// RAZÓN SOCIAL</p>
                <p className="text-white/70 normal-case tracking-normal text-[12px] font-sans">
                  Servicios y Construcciones Industriales de Victoria
                </p>
              </div>
              <div>
                <p className="text-white/30 mb-2">// DOMICILIO</p>
                <p className="text-white/70 normal-case tracking-normal text-[12px] font-sans">
                  6 de Abril 309, 89603 La Pedrera, Tamaulipas, México
                </p>
              </div>
              <div>
                <p className="text-white/30 mb-2">// CONTACTO</p>
                <p className="text-white/70 normal-case tracking-normal text-[12px] font-sans">
                  833 694 5701<br />
                  <a href="mailto:contacto@secoivsa.com" className="text-[#00A3FF]">contacto@secoivsa.com</a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
