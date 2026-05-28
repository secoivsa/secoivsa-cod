import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/528334930865?text=Hola%20SECOIVSA%2C%20me%20interesa%20información%20de%20Recursos%20Humanos"
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp Recursos Humanos"
      data-cursor="hover"
      className="group fixed bottom-5 right-5 md:bottom-6 md:right-6 z-40 inline-flex items-center gap-3"
    >
      <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-[#00A3FF]/25 font-mono text-[10px] tracking-[0.24em] uppercase text-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Recursos Humanos
      </span>
      <span className="relative w-12 h-12 grid place-items-center rounded-full border border-[#00A3FF]/40 bg-black/70 backdrop-blur-md text-white shadow-[0_8px_32px_-8px_rgba(0,163,255,0.55)] transition-all duration-500 hover:border-[#00A3FF]/80 hover:bg-[#00A3FF]/10 hover:shadow-[0_0_28px_-4px_rgba(0,163,255,0.7)]">
        <span className="absolute inset-0 rounded-full bg-[#00A3FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span
          className="absolute inset-[-2px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,163,255,0.35), transparent 70%)",
            filter: "blur(6px)",
            opacity: 0.55,
          }}
        />
        <MessageCircle className="relative w-[18px] h-[18px] text-white" strokeWidth={1.6} />
      </span>
    </a>
  );
}
