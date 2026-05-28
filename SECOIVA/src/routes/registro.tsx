import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { BrandLogo } from "@/components/BrandLogo";
import { ShieldCheck, Loader2, ArrowLeft, Mail, Lock, User } from "lucide-react";

export const Route = createFileRoute("/registro")({
  head: () => ({ meta: [{ title: "Solicitar acceso — NEXUS OS" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/nexus",
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      setDone(true);
      setTimeout(() => nav({ to: "/login" }), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Error con Google");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#05070a] overflow-hidden px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,oklch(0.62_0.18_248/0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <Link to="/login" className="absolute top-6 left-6 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 z-10">
        <ArrowLeft className="h-4 w-4" /> Volver a Acceder
      </Link>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo className="h-10 w-auto mx-auto" />
          <p className="mt-4 text-[10px] font-mono tracking-[0.35em] uppercase text-primary">
            Solicitar acceso · NEXUS OS
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center py-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-success/10 border border-success/40 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Cuenta creada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Revisa tu correo para confirmar el acceso. Te redirigiremos al login...
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Crear cuenta</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acceso operativo a la plataforma industrial.
              </p>

              <button
                onClick={googleSignIn}
                disabled={loading}
                className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-md bg-white text-[#1f1f1f] px-6 py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition"
              >
                Continuar con Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">o</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                <Field icon={User} label="Nombre completo" value={fullName} onChange={setFullName} required />
                <Field icon={Mail} label="Correo" type="email" value={email} onChange={setEmail} required />
                <Field icon={Lock} label="Contraseña" type="password" value={password} onChange={setPassword} required minLength={6} />

                {error && <p className="text-sm text-danger">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Crear cuenta
                </button>
              </form>

              <p className="mt-4 text-[10px] text-muted-foreground text-center leading-relaxed">
                Al crear cuenta aceptas las políticas operativas de SECOIVSA.
                Tu rol será asignado por el administrador de tu organización.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, label, value, onChange, type = "text", required, minLength,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">{label}</label>
      <div className="relative mt-2">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md bg-white/[0.03] border border-white/[0.08] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  );
}
