import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  type: "info" | "success" | "warning" | "critical";
  category: string | null;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const TYPE_META = {
  info:     { icon: Info,          color: "text-blue-300" },
  success:  { icon: CheckCircle2,  color: "text-emerald-300" },
  warning:  { icon: AlertTriangle, color: "text-amber-300" },
  critical: { icon: AlertOctagon,  color: "text-red-300" },
} as const;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationsBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Notif[];
    },
  });

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAllRead() {
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).in("id", ids);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true, read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-md hover:bg-white/[0.04] transition">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[9px] font-mono font-bold flex items-center justify-center text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[480px] rounded-lg border border-white/[0.08] bg-[#0a0d12] shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
              Notificaciones · {unread} sin leer
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-mono tracking-[0.2em] uppercase text-primary hover:opacity-80 inline-flex items-center gap-1">
                <CheckCheck className="h-3 w-3" /> Marcar
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {items.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">Sin notificaciones</div>
            )}
            {items.map((n) => {
              const M = TYPE_META[n.type];
              const Inner = (
                <div className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition cursor-pointer flex gap-3 ${!n.read ? "bg-primary/[0.04]" : ""}`}>
                  <M.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${M.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-medium truncate">{n.title}</div>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    {n.message && <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</div>}
                    <div className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/70 mt-1">
                      {n.category ?? "—"} · hace {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              );
              const onClick = () => { markRead(n.id); setOpen(false); };
              return n.link ? (
                <Link key={n.id} to={n.link as never} onClick={onClick}>{Inner}</Link>
              ) : (
                <div key={n.id} onClick={onClick}>{Inner}</div>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between">
            <Link to="/nexus/alerts" onClick={() => setOpen(false)} className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground">
              Alert center
            </Link>
            <Link to="/nexus/approvals" onClick={() => setOpen(false)} className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground">
              Aprobaciones
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
