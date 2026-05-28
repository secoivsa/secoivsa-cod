import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Loader2, Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Restablecer contraseña — NEXUS OS" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) setError(error.message);
    else setMsg("Si el correo está registrado, recibirás un enlace de restablecimiento.");
    setLoading(false);
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMsg("Contraseña actualizada. Ya puedes acceder.");
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#05070a] overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.62_0.18_248/0.15),transparent_60%)]" />

      <Link to="/login" className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 z-10">
        <ArrowLeft className="h-4 w-4" /> Volver a Acceder
      </Link>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo className="h-10 w-auto mx-auto" />
          <p className="mt-4 text-[10px] font-mono tracking-[0.35em] uppercase text-primary">
            Recuperación de acceso
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold">
            {mode === "request" ? "Restablecer contraseña" : "Nueva contraseña"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "request"
              ? "Te enviaremos un enlace seguro a tu correo."
              : "Define una nueva contraseña para tu cuenta."}
          </p>

          {mode === "request" ? (
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Correo</label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md bg-white/[0.03] border border-white/[0.08] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              {msg && <p className="text-sm text-success">{msg}</p>}
              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Enviar enlace
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="mt-6 space-y-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Nueva contraseña</label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md bg-white/[0.03] border border-white/[0.08] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              {msg && <p className="text-sm text-success">{msg}</p>}
              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Actualizar contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
