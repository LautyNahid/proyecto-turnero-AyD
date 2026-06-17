import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirige automáticamente a la página de inicio de sesión de Clerk
  redirect("/sign-in");
}