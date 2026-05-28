import { useEffect, useState } from "react";
import { Search, Building2 } from "lucide-react";
import type { Profile, AppRole } from "@/hooks/use-auth";
import { NotificationsBell } from "./NotificationsBell";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { useOrgBranding } from "./BrandingProvider";

export function NexusTopbar({
  profile,
  roles,
  title,
  subtitle,
}: {
  profile: Profile | null;
  roles: AppRole[];
  title?: string;
  subtitle?: string;
}) {
  const initial = (profile?.full_name ?? profile?.email ?? "?")[0].toUpperCase();
  const primaryRole = roles[0] ?? "—";
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: org } = useOrgBranding();
  const orgLabel = (org?.commercial_name ?? org?.name ?? "SECOIVSA COD").toUpperCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-6 gap-2 bg-[#0a0d12]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
          <MobileNav />
          <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase truncate max-w-[140px]">{orgLabel}</span>
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="group flex items-center gap-2 flex-1 min-w-0 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition text-left"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate text-xs text-muted-foreground">
              <span className="hidden md:inline">Buscar proyectos, personal, documentos...</span>
              <span className="md:hidden">Buscar...</span>
            </span>
            <kbd className="hidden sm:inline font-mono text-[9px] text-muted-foreground border border-white/10 px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {title && (
            <div className="hidden xl:block text-right leading-tight">
              <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
                {subtitle}
              </div>
              <div className="text-sm font-semibold">{title}</div>
            </div>
          )}
          <NotificationsBell />
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l border-white/[0.06]">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-xs font-semibold truncate max-w-[140px]">
                {profile?.full_name ?? profile?.email}
              </div>
              <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-primary">
                {primaryRole}
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-xs font-mono font-bold">
              {initial}
            </div>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
