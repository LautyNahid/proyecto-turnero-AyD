export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registrarHandlersNotificacion } =
      await import("@/lib/handlers/notificacion.handlers");
    registrarHandlersNotificacion();
  }
}
