import { Trophy } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo (Branding) */}
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
            Bienvenido<br />de nuevo a<br /><span className="text-lime">SalePadel.</span>
          </h1>
          <p className="mt-6 text-primary-foreground/70 max-w-md">
            Ingresá a tu cuenta para gestionar tus reservas y seguir jugando.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 size-[500px] rounded-full bg-lime/10 blur-3xl" />
        <div className="text-xs text-primary-foreground/50">© 2026 SalePadel · Demo académica</div>
      </div>

      {/* Lado derecho (Clerk Sign In) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="lg:hidden flex items-center gap-2 mb-8 self-start">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Trophy className="size-4" />
            </div>
            <span className="font-bold">SalePadel</span>
          </div>
          
          {/* Clerk se encarga de todo el formulario y de la redirección a Sign Up */}
          <SignIn />
          
        </div>
      </div>
    </div>
  );
}