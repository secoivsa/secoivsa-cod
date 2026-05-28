import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Acceso SECOIVSA COD — SECOIVSA" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) nav({ to: "/nexus", replace: true });
  }, [user, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Error con Google");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#05070a] overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.62_0.18_248/0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />


      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo className="h-10 w-auto mx-auto" />
          <p className="mt-4 text-[10px] font-mono tracking-[0.35em] uppercase text-primary flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> SECOIVSA COD · Industrial Operating System
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold">Ingresar a SECOIVSA COD</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acceso a la plataforma operativa de SECOIVSA.
          </p>

          <button
            type="button"
            onClick={googleSignIn}
            disabled={googleLoading || loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-md bg-white text-[#1f1f1f] px-6 py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continuar con Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">o</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                Correo corporativo
              </label>
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
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                  Contraseña
                </label>
                <Link to="/reset-password" className="text-[10px] text-muted-foreground hover:text-foreground">
                  ¿Olvidaste?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Acceder
            </button>
          </form>

          <Link
            to="/registro"
            className="mt-5 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            ¿Sin acceso? Solicitar cuenta
          </Link>
        </div>

        <p className="mt-6 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          Acceso protegido · Sesión cifrada
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
