import logo from "@/assets/secoivsa-logo.png";

export function BrandLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return <img src={logo} alt="SECOIVSA — Construcción Industrial" className={className} loading="eager" />;
}
