"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Mail, Lock, User as UserIcon, Building2, Shield } from "lucide-react";

const roles = [
  { id: "player", label: "Jugador", icon: UserIcon, desc: "Reservá y armá partidos" },
  { id: "club", label: "Admin Complejo", icon: Building2, desc: "Gestioná tus canchas" },
  { id: "super", label: "SuperAdmin", icon: Shield, desc: "Control de la plataforma" },
];

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState("player");
  const router = useRouter();

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-primary-foreground relative overflow-hidden"
        style={{ background: "var(--gradient-court)" }}
      >
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-lime flex items-center justify-center text-lime-foreground">
            <Trophy className="size-5" />
          </div>
          <span className="font-bold text-lg">SalePadel</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Tu próximo<br />partido empieza<br /><span className="text-lime">acá.</span>
          </h1>
          <p className="mt-6 text-primary-foreground/70 max-w-md">
            Reservá canchas, armá lobbies con tus amigos y conocé jugadores de tu nivel. Todo en un solo lugar.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <Stat n="120+" l="Complejos" />
            <Stat n="8.4k" l="Jugadores" />
            <Stat n="32k" l="Partidos" />
          </div>
        </div>
        <div className="absolute right-0 bottom-0 size-[500px] rounded-full bg-lime/10 blur-3xl" />
        <div className="text-xs text-primary-foreground/50">© 2025 SalePadel · Demo académica</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Trophy className="size-4" />
            </div>
            <span className="font-bold">SalePadel</span>
          </div>

          <div className="inline-flex bg-muted rounded-full p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${mode === "login" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-5 py-1.5 rounded-full text-sm font-semibold transition ${mode === "register" ? "bg-card shadow-soft" : "text-muted-foreground"}`}
            >
              Registrarse
            </button>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">
            {mode === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Ingresá tus datos para continuar." : "Completá tus datos para empezar a jugar."}
          </p>

          <div className="mt-6 space-y-4">
            {mode === "register" && (
              <Field icon={UserIcon} label="Nombre completo" placeholder="Martín Rodríguez" />
            )}
            <Field icon={Mail} label="Email" placeholder="vos@email.com" type="email" />
            <Field icon={Lock} label="Contraseña" placeholder="••••••••" type="password" />

            <div>
              <div className="text-sm font-semibold mb-2">Tipo de cuenta</div>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`p-3 rounded-xl border text-left transition ${role === r.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                  >
                    <r.icon className={`size-4 mb-1.5 ${role === r.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-xs font-semibold leading-tight">{r.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="block w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-center hover:opacity-90 transition"
            >
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>

            <div className="text-center text-xs text-muted-foreground">
              {mode === "login" ? "¿Olvidaste tu contraseña?" : "Al registrarte aceptás nuestros términos"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, type = "text", placeholder }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type?: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 px-3 h-11 rounded-xl border border-input bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-ring">
        <Icon className="size-4 text-muted-foreground" />
        <input type={type} placeholder={placeholder} className="flex-1 bg-transparent outline-none text-sm" />
      </div>
    </label>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-lime">{n}</div>
      <div className="text-xs text-primary-foreground/60">{l}</div>
    </div>
  );
}