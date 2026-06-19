import { Trophy } from "lucide-react";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo Marca/Sponsors - Ampliado al 60% (w-[60%]) y con más padding en pantallas extra grandes (xl:p-20) */}
      <div className="hidden lg:flex flex-col justify-between lg:w-[60%] p-12 xl:p-20 relative overflow-hidden bg-zinc-950 text-white">
        
        {/* Imagen de fondo con capa oscura (Overlay) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/cancha_fondo.png"
            alt="Fondo de cancha de pádel"
            fill
            className="object-cover opacity-55 mix-blend-luminosity"
            priority
          />
          {/* Gradiente ajustado para que sea un poco más oscuro y el texto resalte perfecto */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/90 via-zinc-950/80 to-black/95" />
        </div>

        {/* Logo superior */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="size-10 rounded-xl bg-lime flex items-center justify-center text-lime-foreground">
            <Trophy className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-wide">SalePadel</span>
        </div>

        {/* Textos principales - Con mejor jerarquía y espaciado (max-w-2xl para que no se estire de más) */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-6xl md:text-7xl font-black leading-none tracking-tighter text-lime mb-2">
            ComplejoPadel
          </h1>
          <h2 className="text-3xl md:text-3xl font-semibold text-white tracking-tight mb-6">
            Armá tu próximo partido.
          </h2>
          <p className="text-lg md:text-l text-gray-300 leading-relaxed">
            Olvidate de las vueltas para conseguir cancha. Reservá tu turno en segundos, sumate a partidos abiertos y preparate para entrar a la pista.
          </p>
        </div>

        {/* Sponsors y Footer */}
        <div className="relative z-10 flex flex-col gap-8">
          {/* Fila de Sponsors del Complejo*/}
          <div className="flex items-center gap-8 text-white/50 grayscale transition-all hover:grayscale-0">
            <span className="font-black text-2xl italic">Bullpadel</span>
            <span className="font-bold text-2xl tracking-tighter">Wilson</span>
            <span className="font-bold text-xl font-serif">Coca-Cola</span>
            <div className="flex items-center gap-2 ml-auto">
              <Trophy className="size-4 text-lime" />
              <span className="font-bold text-sm text-white">ComplejoPadel</span>
            </div>
          </div>
          
          <div className="text-xs text-white/40">
            © 2026 SalePadel · Demo académica
          </div>
        </div>
      </div>

      {/* Lado derecho (Clerk Sign In) - Ocupa el resto del espacio (flex-1) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Trophy className="size-4" />
            </div>
            <span className="font-bold">SalePadel</span>
          </div>
        
          <SignIn />
          
        </div>
      </div>
    </div>
  );
}