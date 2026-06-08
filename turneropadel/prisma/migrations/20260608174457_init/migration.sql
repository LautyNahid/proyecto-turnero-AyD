-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('Disponible', 'Reservado', 'EnCurso', 'Finalizado');

-- CreateEnum
CREATE TYPE "EstadoLobby" AS ENUM ('Abierto', 'Confirmado', 'Finalizado', 'Cancelado');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('Pendiente', 'Aceptada', 'Rechazada', 'Cancelada');

-- CreateEnum
CREATE TYPE "EstadoNotificacion" AS ENUM ('Pendiente', 'Enviada', 'Fallida');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('LobbyConfirmado', 'RecordatorioTurno', 'TurnoFinalizado', 'SolicitudRechazada', 'SolicitudAceptada', 'JugadorExpulsado', 'CancelacionLobby');

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo_electronico" TEXT NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "jugador" (
    "id_usuario" TEXT NOT NULL,
    "categoria" INTEGER NOT NULL,
    "partidos_ganados" INTEGER NOT NULL DEFAULT 0,
    "partidos_jugados" INTEGER NOT NULL DEFAULT 0,
    "ciudad" TEXT NOT NULL,
    "penalizaciones" INTEGER NOT NULL DEFAULT 0,
    "reputacion_promedio" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "evaluaciones_recibidas" INTEGER NOT NULL DEFAULT 0,
    "es_destacado" BOOLEAN NOT NULL DEFAULT false,
    "es_poco_confiable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "jugador_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "empleado" (
    "id_usuario" TEXT NOT NULL,

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "admin" (
    "id_usuario" TEXT NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "cancha" (
    "id_cancha" SERIAL NOT NULL,
    "nro_cancha" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cancha_pkey" PRIMARY KEY ("id_cancha")
);

-- CreateTable
CREATE TABLE "turno" (
    "id_turno" SERIAL NOT NULL,
    "id_cancha" INTEGER NOT NULL,
    "hora" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "estado_turno" "EstadoTurno" NOT NULL DEFAULT 'Disponible',

    CONSTRAINT "turno_pkey" PRIMARY KEY ("id_turno")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id_reserva" SERIAL NOT NULL,
    "id_jugador" TEXT NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "bloqueo_horario" (
    "id_bloqueo" SERIAL NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "bloqueado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueo_horario_pkey" PRIMARY KEY ("id_bloqueo")
);

-- CreateTable
CREATE TABLE "lobby" (
    "id_lobby" SERIAL NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "id_creador" TEXT NOT NULL,
    "estado_lobby" "EstadoLobby" NOT NULL DEFAULT 'Abierto',
    "jugadores_faltantes" INTEGER NOT NULL,
    "id_reserva" INTEGER,

    CONSTRAINT "lobby_pkey" PRIMARY KEY ("id_lobby")
);

-- CreateTable
CREATE TABLE "lobby_jugador" (
    "id_lobby" INTEGER NOT NULL,
    "id_jugador" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lobby_jugador_pkey" PRIMARY KEY ("id_lobby","id_jugador")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "id_solicitud" SERIAL NOT NULL,
    "id_jugador" TEXT NOT NULL,
    "id_lobby" INTEGER NOT NULL,
    "estado_solicitud" "EstadoSolicitud" NOT NULL DEFAULT 'Pendiente',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "evaluacion_jugador" (
    "id_evaluacion" SERIAL NOT NULL,
    "id_evaluador" TEXT NOT NULL,
    "id_evaluado" TEXT NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_jugador_pkey" PRIMARY KEY ("id_evaluacion")
);

-- CreateTable
CREATE TABLE "evaluacion_turno" (
    "id_evaluacion" SERIAL NOT NULL,
    "id_jugador" TEXT NOT NULL,
    "id_turno" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_turno_pkey" PRIMARY KEY ("id_evaluacion")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "id_destinatario" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "estado" "EstadoNotificacion" NOT NULL DEFAULT 'Pendiente',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviada_en" TIMESTAMP(3),

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "reporte_semanal" (
    "id_reporte" SERIAL NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "datos_json" JSONB NOT NULL,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporte_semanal_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_electronico_key" ON "usuario"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "cancha_nro_cancha_key" ON "cancha"("nro_cancha");

-- CreateIndex
CREATE UNIQUE INDEX "turno_id_cancha_fecha_hora_key" ON "turno"("id_cancha", "fecha", "hora");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_id_turno_key" ON "reserva"("id_turno");

-- CreateIndex
CREATE UNIQUE INDEX "lobby_id_turno_key" ON "lobby"("id_turno");

-- CreateIndex
CREATE UNIQUE INDEX "lobby_id_reserva_key" ON "lobby"("id_reserva");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_id_jugador_id_lobby_key" ON "solicitud"("id_jugador", "id_lobby");

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_jugador_id_evaluador_id_evaluado_id_reserva_key" ON "evaluacion_jugador"("id_evaluador", "id_evaluado", "id_reserva");

-- CreateIndex
CREATE UNIQUE INDEX "evaluacion_turno_id_jugador_id_turno_key" ON "evaluacion_turno"("id_jugador", "id_turno");

-- CreateIndex
CREATE UNIQUE INDEX "reporte_semanal_periodo_inicio_periodo_fin_key" ON "reporte_semanal"("periodo_inicio", "periodo_fin");

-- AddForeignKey
ALTER TABLE "jugador" ADD CONSTRAINT "jugador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turno" ADD CONSTRAINT "turno_id_cancha_fkey" FOREIGN KEY ("id_cancha") REFERENCES "cancha"("id_cancha") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo_horario" ADD CONSTRAINT "bloqueo_horario_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby" ADD CONSTRAINT "lobby_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby" ADD CONSTRAINT "lobby_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby" ADD CONSTRAINT "lobby_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "reserva"("id_reserva") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_jugador" ADD CONSTRAINT "lobby_jugador_id_lobby_fkey" FOREIGN KEY ("id_lobby") REFERENCES "lobby"("id_lobby") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_jugador" ADD CONSTRAINT "lobby_jugador_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_id_lobby_fkey" FOREIGN KEY ("id_lobby") REFERENCES "lobby"("id_lobby") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_jugador" ADD CONSTRAINT "evaluacion_jugador_id_evaluador_fkey" FOREIGN KEY ("id_evaluador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_jugador" ADD CONSTRAINT "evaluacion_jugador_id_evaluado_fkey" FOREIGN KEY ("id_evaluado") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_jugador" ADD CONSTRAINT "evaluacion_jugador_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "reserva"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_turno" ADD CONSTRAINT "evaluacion_turno_id_jugador_fkey" FOREIGN KEY ("id_jugador") REFERENCES "jugador"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_turno" ADD CONSTRAINT "evaluacion_turno_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_destinatario_fkey" FOREIGN KEY ("id_destinatario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
