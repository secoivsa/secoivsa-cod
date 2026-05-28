import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <button
      aria-label="Subir"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 left-5 md:bottom-6 md:left-6 z-40 w-12 h-12 rounded-full grid place-items-center border border-white/15 bg-black/60 backdrop-blur-md text-white/85 shadow-[0_10px_40px_-12px_rgba(0,163,255,0.55)] transition-all duration-500 hover:border-[#00A3FF]/50 hover:text-white hover:bg-[#00A3FF]/10 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-[18px] h-[18px]" strokeWidth={1.6} />
    </button>
  );
}
