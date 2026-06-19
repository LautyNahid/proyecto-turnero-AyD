import { Trophy } from "lucide-react";
import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo Marca */}
      <div className="hidden lg:flex flex-col justify-between lg:w-[60%] p-12 xl:p-20 relative overflow-hidden bg-zinc-950 text-white">
        
        {/* Imagen de fondo con capa oscura (Overlay) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fondo_signup.jpg" 
            alt="Fondo de cancha de pádel"
            fill
            className="object-cover opacity-60 mix-blend-luminosity"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-zinc-950/80 to-black/95" />
        </div>

        {/* Logo superior */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="size-10 rounded-xl bg-lime flex items-center justify-center text-lime-foreground">
            <Trophy className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-wide">SalePadel</span>
        </div>

        {/* Textos principales y Estadísticas */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tighter text-white mb-6">
            Tu próximo<br />partido empieza<br /><span className="text-lime">acá.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-12">
            Reservá canchas, armá lobbies con tus amigos y conocé jugadores de tu nivel. Todo en un solo lugar.
          </p>
          
          {/* Grilla de Estadísticas */}
          <div className="grid grid-cols-3 gap-6 max-w-md border-t border-white/10 pt-8">
            <Stat n="120+" l="Complejos" />
            <Stat n="8.4k" l="Jugadores" />
            <Stat n="32k" l="Partidos" />
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/40">
          © 2026 SalePadel · Demo académica
        </div>
      </div>

      {/* Lado derecho (Clerk Sign Up) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Trophy className="size-4" />
            </div>
            <span className="font-bold">SalePadel</span>
          </div>
          
          {/* Clerk se encarga de todo el formulario y de la redirección a Sign In */}
          <SignUp />
          
        </div>
      </div>
    </div>
  );
}

// Componente Stat ajustado para la nueva paleta oscura
function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-3xl font-black text-lime tracking-tight">{n}</div>
      <div className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">{l}</div>
    </div>
  );
}