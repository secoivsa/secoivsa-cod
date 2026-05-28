export function AmbientFx() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {/* Soft blue radial */}
      <div className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(79,158,255,0.10),transparent_60%)] blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[55vw] h-[55vw] rounded-full bg-[radial-gradient(circle,rgba(125,196,255,0.07),transparent_60%)] blur-3xl" />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </div>
  );
}
