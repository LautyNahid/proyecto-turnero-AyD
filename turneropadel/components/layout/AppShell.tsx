"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Users2,
  User,
  Building2,
  BarChart3,
  Bell,
  LogOut,
  Search,
  Trophy,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HeaderAuth } from "@/components/layout/headerAuth";

const navMain = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/reservar", label: "Reservar turno", icon: CalendarRange },
  { to: "/partidos", label: "Mis Partidos", icon: Users2 },
  { to: "/perfil", label: "Mi perfil", icon: User },
  { to: "/notificaciones", label: "Notificaciones", icon: Bell },
];

const navAdmin = [
  { to: "/admin", label: "Complejo", icon: Building2 },
  { to: "/admin/reservas", label: "Reservas", icon: Users2 }, 
  { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
];

interface AppShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            <Trophy className="size-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight">SalePadel</div>
            <div className="text-[11px] text-sidebar-foreground/60 -mt-0.5">Reservá. Jugá. Ganá.</div>
          </div>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-2">
            Jugador
          </div>
          <ul className="space-y-0.5">
            {navMain.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    href={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 px-3 mt-6 mb-2">
            Administración
          </div>
          <ul className="space-y-0.5">
            {navAdmin.map((item) => {
              const active = item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    href={item.to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10 flex items-center px-6 gap-4">
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-full bg-muted text-muted-foreground text-sm w-72">
            <Search className="size-4" />
            <input
              placeholder="Buscar canchas, jugadores..."
              className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button className="relative size-9 rounded-full bg-muted hover:bg-accent flex items-center justify-center">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-lime ring-2 ring-card" />
          </button>
          <HeaderAuth />
        </header>
        <div className="flex-1 overflow-y-auto">
          <main className="p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
