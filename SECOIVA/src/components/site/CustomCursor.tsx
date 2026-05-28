import { useEffect, useRef, useState } from "react";

/**
 * Premium industrial HUD cursor — small electric-blue dot + thin
 * delayed ring. Magnetic-style expansion on interactive elements.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 2}px, ${my - 2}px, 0)`;
      }
      const target = e.target as HTMLElement | null;
      const isInteractive = !!target?.closest(
        "a, button, [role=button], input, textarea, select, label, [data-cursor=hover]",
      );
      if (ringRef.current) {
        ringRef.current.classList.toggle("cursor-ring--hover", isInteractive);
      }
    };
    const loop = () => {
      // gentle delayed follow — premium inertia
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 14}px, ${ry - 14}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const onDown = () => ringRef.current?.classList.add("cursor-ring--down");
    const onUp = () => ringRef.current?.classList.remove("cursor-ring--down");

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      {/* Thin outer ring — delayed inertia */}
      <div
        ref={ringRef}
        className="cursor-ring fixed top-0 left-0 w-7 h-7 rounded-full border border-[#4DA6FF]/40 pointer-events-none z-[9999]"
        style={{ willChange: "transform", transition: "width 220ms ease, height 220ms ease, border-color 220ms ease, background 220ms ease" }}
      />
      {/* Central electric dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1 h-1 rounded-full bg-[#4DA6FF] pointer-events-none z-[10000]"
        style={{ willChange: "transform", boxShadow: "0 0 6px rgba(77,166,255,0.85)" }}
      />
    </>
  );
}
