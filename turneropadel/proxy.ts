import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getRolUsuario } from "@/lib/auth";
import { RUTAS_PUBLICAS, RUTAS_ADMIN, puedeVerPanelAdmin } from "@/lib/permissions";

const isPublicRoute = createRouteMatcher(RUTAS_PUBLICAS);
const isRutaAdmin = createRouteMatcher(RUTAS_ADMIN);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  if (!isRutaAdmin(req)) return;

  const { userId } = await auth();
  const roles = await getRolUsuario(userId!);

  if (!puedeVerPanelAdmin(roles ?? [])) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};