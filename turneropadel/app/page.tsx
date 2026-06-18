import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();
// Si el usuario estaba logeado se lo envia directamente al dashboard
  if (userId) {
    redirect("/dashboard");
  } else {
    redirect("/sign-in");
  }
}