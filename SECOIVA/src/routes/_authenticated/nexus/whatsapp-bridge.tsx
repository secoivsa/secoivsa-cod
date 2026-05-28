import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  getBridgeStatus, requestQR, disconnectBridge,
  listLogs, listQueue, retryQueueItem,
  getBridgeDebugInfo, pingProvider, sendTestMessage, simulateInbound,
} from "@/lib/whatsapp-bridge.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, QrCode, RefreshCw, Power, AlertTriangle, CheckCircle2, Inbox, Send, Bug, Activity, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nexus/whatsapp-bridge")({
  head: () => ({ meta: [{ title: "WhatsApp Bridge · NEXUS OS" }] }),
  component: WhatsAppBridge,
});

function statusColor(s?: string) {
  if (s === "connected") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (s === "qr_pending" || s === "connecting") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (s === "error" || s === "expired") return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-white/5 text-muted-foreground border-white/10";
}

function WhatsAppBridge() {
  const getStatusFn = useServerFn(getBridgeStatus);
  const reqQrFn = useServerFn(requestQR);
  const disconnectFn = useServerFn(disconnectBridge);
  const logsFn = useServerFn(listLogs);
  const queueFn = useServerFn(listQueue);
  const retryFn = useServerFn(retryQueueItem);
  const debugFn = useServerFn(getBridgeDebugInfo);
  const pingFn = useServerFn(pingProvider);
  const sendTestFn = useServerFn(sendTestMessage);
  const simInFn = useServerFn(simulateInbound);

  const status = useQuery({
    queryKey: ["wa-bridge-status"],
    queryFn: () => getStatusFn(),
    refetchInterval: 10_000,
  });
  const logs = useQuery({ queryKey: ["wa-bridge-logs"], queryFn: () => logsFn(), refetchInterval: 15_000 });
  const queue = useQuery({ queryKey: ["wa-bridge-queue"], queryFn: () => queueFn(), refetchInterval: 8_000 });

  const [qr, setQr] = useState<string | null>(null);
  const qrMut = useMutation({
    mutationFn: () => reqQrFn(),
    onSuccess: (r) => {
      setQr(r.qr_base64);
      toast.success(`Estado: ${r.status}`);
      status.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const disMut = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => { setQr(null); toast.success("Desconectado"); status.refetch(); },
  });
  const retryMut = useMutation({
    mutationFn: (id: string) => retryFn({ data: { id } }),
    onSuccess: () => { queue.refetch(); toast.success("Reintento enviado"); },
  });

  // Debug / Test state
  const debug = useQuery({ queryKey: ["wa-bridge-debug"], queryFn: () => debugFn(), refetchInterval: 8_000 });
  const [testTo, setTestTo] = useState("528449122103");
  const [testBody, setTestBody] = useState("");
  const [simFrom, setSimFrom] = useState("525555555555");
  const [simBody, setSimBody] = useState("Hola, soy soldador 6G con 8 años de experiencia, ¿tienen vacante?");
  const pingMut = useMutation({
    mutationFn: () => pingFn(),
    onSuccess: (r) => toast.success(`Provider: ${r.status}${r.phone ? ` · +${r.phone}` : ""}`),
    onError: (e: Error) => toast.error(e.message),
  });
  const testMut = useMutation({
    mutationFn: () => sendTestFn({ data: { to: testTo, body: testBody || undefined } }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Mensaje de prueba enviado");
      else toast.error(`Falló: ${r.error}`);
      queue.refetch(); logs.refetch(); debug.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const simMut = useMutation({
    mutationFn: () => simInFn({ data: { from: simFrom, body: simBody } }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Simulado: IA respondió");
      else toast.error(`IA falló: ${r.error}`);
      queue.refetch(); logs.refetch(); debug.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/public/whatsapp/webhook`
    : "/api/public/whatsapp/webhook";

  const s = status.data?.session;
  const remote = status.data?.remote;
  const configured = status.data?.configured;
  const qrShown = qr ?? s?.qr_base64 ?? null;
  const qrSrc = qrShown
    ? (qrShown.startsWith("data:") ? qrShown : `data:image/png;base64,${qrShown}`)
    : null;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto space-y-8">
      <header className="flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-[10px] font-mono tracking-[0.4em] text-muted-foreground">NEXUS · WHATSAPP BRIDGE</div>
          <h1 className="text-3xl font-display mt-1">Bridge WhatsApp Business</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conexión QR persistente vía UAZAPI. Mensajes en tiempo real → Recruiting + Mail Hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor(s?.status)}>
            {s?.status ?? "—"}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px]">
            {status.data?.provider ?? "..."}
          </Badge>
        </div>
      </header>

      {!configured && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            UAZAPI no está configurado. Faltan <code className="font-mono">UAZAPI_URL</code> o{" "}
            <code className="font-mono">UAZAPI_INSTANCE_TOKEN</code>. El bridge correrá en modo placeholder.
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sesión</div>
              <div className="text-lg font-display mt-0.5">{s?.instance_name ?? "—"}</div>
              {s?.phone_number && (
                <div className="text-sm text-muted-foreground font-mono mt-1">+{s.phone_number}</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => qrMut.mutate()}
                disabled={qrMut.isPending}
                size="sm"
              >
                {qrMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {s?.status === "connected" ? "Forzar reconexión" : "Generar QR"}
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => status.refetch()}
                disabled={status.isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${status.isFetching ? "animate-spin" : ""}`} />
              </Button>
              {s?.status === "connected" && (
                <Button variant="destructive" size="sm" onClick={() => disMut.mutate()} disabled={disMut.isPending}>
                  <Power className="h-4 w-4" /> Desconectar
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[280px] border border-dashed border-white/10 rounded-lg p-6">
            {s?.status === "connected" ? (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <div className="text-emerald-300 font-display text-lg">Conectado</div>
                <div className="text-xs text-muted-foreground font-mono">
                  Last seen: {s.last_seen_at ? new Date(s.last_seen_at).toLocaleString() : "—"}
                </div>
              </div>
            ) : qrSrc ? (
              <div className="text-center space-y-3">
                <img src={qrSrc} alt="QR WhatsApp" className="w-64 h-64 mx-auto rounded bg-white p-2" />
                <div className="text-xs text-muted-foreground">
                  Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <QrCode className="h-10 w-10 mx-auto opacity-40 mb-2" />
                Sin QR activo. Presiona <strong>Generar QR</strong> para iniciar la sesión.
              </div>
            )}
          </div>

          {s?.last_error && (
            <div className="text-xs text-red-300 font-mono bg-red-500/5 border border-red-500/20 rounded p-2">
              {s.last_error}
            </div>
          )}
          {remote && (
            <div className="text-[11px] text-muted-foreground font-mono">
              remote.status = {remote.status}{remote.phone_number ? ` · +${remote.phone_number}` : ""}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Logs de sesión</div>
            <Badge variant="outline" className="text-[10px]">{logs.data?.logs.length ?? 0}</Badge>
          </div>
          <ScrollArea className="h-[420px]">
            <div className="space-y-1 pr-2">
              {(logs.data?.logs ?? []).map((l) => (
                <div key={l.id} className="text-[11px] font-mono py-1 border-b border-white/5 last:border-0">
                  <span className={
                    l.level === "error" ? "text-red-300"
                    : l.level === "warning" ? "text-amber-300"
                    : "text-muted-foreground"
                  }>
                    {new Date(l.created_at).toLocaleTimeString()} · {l.level}
                  </span>
                  <div className="text-foreground/80">{l.message}</div>
                </div>
              ))}
              {!logs.data?.logs.length && (
                <div className="text-xs text-muted-foreground p-4 text-center">Sin eventos aún</div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cola de mensajes</div>
            <div className="text-lg font-display mt-0.5">Entrantes & Salientes</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => queue.refetch()} disabled={queue.isFetching}>
            <RefreshCw className={`h-4 w-4 ${queue.isFetching ? "animate-spin" : ""}`} /> Refrescar
          </Button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {(queue.data?.items ?? []).map((it) => (
            <div key={it.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="shrink-0 mt-1">
                {it.direction === "inbound"
                  ? <Inbox className="h-4 w-4 text-sky-300" />
                  : <Send className="h-4 w-4 text-emerald-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-foreground/80">+{it.phone_number}</span>
                  <Badge variant="outline" className={`text-[9px] ${
                    it.status === "sent" || it.status === "delivered" ? "border-emerald-500/30 text-emerald-300"
                    : it.status === "failed" || it.status === "blocked" ? "border-red-500/30 text-red-300"
                    : "border-amber-500/30 text-amber-300"
                  }`}>{it.status}</Badge>
                  {it.media_kind && <Badge variant="outline" className="text-[9px]">{it.media_kind}</Badge>}
                  <span className="text-muted-foreground ml-auto">{new Date(it.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="text-sm text-foreground/90 mt-1 truncate">
                  {it.body || (it.media_url ? `[${it.media_kind ?? "media"}]` : "—")}
                </div>
                {it.last_error && <div className="text-[10px] text-red-300 font-mono mt-1">{it.last_error}</div>}
              </div>
              {it.direction === "outbound" && it.status === "failed" && (
                <Button size="sm" variant="outline"
                  onClick={() => retryMut.mutate(it.id)}
                  disabled={retryMut.isPending}>
                  Reintentar
                </Button>
              )}
            </div>
          ))}
          {!queue.data?.items.length && (
            <div className="text-sm text-muted-foreground p-8 text-center">Cola vacía</div>
          )}
        </div>
      </Card>

      {/* ============ DEBUG & TEST PANEL ============ */}
      <Card className="p-6 space-y-5 border-sky-500/20 bg-sky-500/[0.02]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-sky-300" />
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Debug · Diagnóstico end-to-end</div>
              <div className="text-lg font-display mt-0.5">Test & Telemetría WhatsApp</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => pingMut.mutate()} disabled={pingMut.isPending}>
              {pingMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Activity className="h-3 w-3" />}
              Ping provider
            </Button>
            <Button size="sm" variant="outline" onClick={() => debug.refetch()} disabled={debug.isFetching}>
              <RefreshCw className={`h-3 w-3 ${debug.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="rounded-lg border border-white/10 p-3 bg-black/30">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Webhook URL (configurar en UAZAPI)</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-sky-300 break-all">{webhookUrl}</code>
            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada"); }}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-[10px] text-muted-foreground mt-2">
            Event types requeridos: <code className="font-mono">messages</code>. Si configuras secret en UAZAPI, ponlo en
            <code className="font-mono"> UAZAPI_WEBHOOK_SECRET</code> o agrega <code className="font-mono">?secret=…</code> a la URL.
          </div>
        </div>

        {/* Env status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
          {debug.data?.env && Object.entries(debug.data.env).map(([k, v]) => (
            <div key={k} className={`rounded border px-2 py-1.5 flex items-center justify-between gap-2 ${
              v ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300" : "border-red-500/30 bg-red-500/5 text-red-300"
            }`}>
              <span className="truncate">{k}</span>
              <span>{typeof v === "boolean" ? (v ? "✓" : "✗") : String(v)}</span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Send test outbound */}
          <div className="rounded-lg border border-white/10 p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Send className="h-3 w-3" /> Enviar mensaje de prueba (saliente)
            </div>
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="528449122103" className="font-mono text-xs" />
            <Textarea value={testBody} onChange={(e) => setTestBody(e.target.value)} placeholder="(opcional) Mensaje. Default: 🧪 Test SECOIVSA · timestamp" rows={2} className="text-xs" />
            <Button size="sm" className="w-full" onClick={() => testMut.mutate()} disabled={testMut.isPending || !testTo}>
              {testMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Enviar prueba
            </Button>
          </div>

          {/* Simulate inbound */}
          <div className="rounded-lg border border-white/10 p-4 space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Inbox className="h-3 w-3" /> Simular entrante (ejecuta IA RH)
            </div>
            <Input value={simFrom} onChange={(e) => setSimFrom(e.target.value)} placeholder="525555555555" className="font-mono text-xs" />
            <Textarea value={simBody} onChange={(e) => setSimBody(e.target.value)} rows={2} className="text-xs" />
            <Button size="sm" variant="secondary" className="w-full" onClick={() => simMut.mutate()} disabled={simMut.isPending || !simFrom || !simBody}>
              {simMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bug className="h-3 w-3" />}
              Disparar IA RH
            </Button>
          </div>
        </div>

        {/* Raw payloads / debug logs */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Trazas crudas (últimos 40 eventos · webhook + IA)
          </div>
          <ScrollArea className="h-[320px] rounded border border-white/10 bg-black/30">
            <div className="p-3 space-y-2">
              {(debug.data?.logs ?? []).map((l) => (
                <details key={l.id} className="text-[11px] font-mono border-b border-white/5 pb-2 last:border-0">
                  <summary className="cursor-pointer flex items-center gap-2">
                    <span className={
                      l.level === "error" ? "text-red-300"
                      : l.level === "warning" ? "text-amber-300"
                      : l.level === "debug" ? "text-sky-300"
                      : "text-emerald-300"
                    }>{l.level}</span>
                    <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
                    <span className="text-foreground/80 truncate">{l.message}</span>
                  </summary>
                  <pre className="mt-2 text-[10px] text-muted-foreground whitespace-pre-wrap break-all bg-black/40 p-2 rounded border border-white/5">
                    {JSON.stringify(l.payload, null, 2)}
                  </pre>
                </details>
              ))}
              {!debug.data?.logs.length && (
                <div className="text-xs text-muted-foreground p-4 text-center">
                  Sin trazas aún. Dispara una simulación o un test para ver la pipeline completa.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
