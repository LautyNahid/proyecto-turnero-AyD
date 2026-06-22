# Turnero Padel

Sistema integral de gestión de turnos y reservas para complejos de pádel, con funcionalidades avanzadas de lobby, evaluaciones de jugadores y notificaciones en tiempo real.

## Stack Tecnológico

- **Frontend:** Next.js 15+ (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Backend:** Next.js API Routes, Node.js
- **Base de Datos:** PostgreSQL (Neon), Prisma ORM
- **Autenticación:** Clerk Authentication
- **Herramientas:** ESLint, Instrumentation API, Leaflet para mapas

## Requisitos Previos

- Node.js 18+ y npm/yarn/pnpm
- PostgreSQL 14+ (o Neon account)
- Clerk account para autenticación
- Variables de entorno configuradas

## Instalación y Setup

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd proyecto-turnero-AyD/turneropadel
```

2. **Instalar dependencias:**
```bash
npm install
# El script postinstall generará el cliente Prisma automáticamente
```

3. **Configurar variables de entorno:**
Copiar `.env.example` a `.env.local` y configurar:
```bash
# Base de datos
DATABASE_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
CLERK_WEBHOOK_SECRET="..."

# API endpoints y configuración
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

4. **Ejecutar migraciones Prisma:**
```bash
npx prisma migrate dev
# Para seed de datos (si existe):
# npx prisma db seed
```

5. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

Acceder a [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo (hot reload)
npm run build    # Construye la aplicación para producción
npm run start    # Inicia el servidor en producción
npm run lint     # Ejecuta ESLint en el código
```

## Características Principales

- **Gestión de Turnos:** Reserva y administración de turnos en canchas de pádel
- **Sistema de Lobbies:** Creación y gestión de partidos con búsqueda de jugadores
- **Evaluaciones:** Sistema de calificación entre jugadores con reputación
- **Dashboard Administrativo:** Gestión de canchas, reportes, bloqueos y KPIs
- **Notificaciones:** Alertas en tiempo real para confirmaciones, invitaciones y cambios
- **Autenticación:** Login seguro con Clerk y gestión de roles (Jugador, Empleado, Admin)
- **Reportes:** Generación de reportes en Excel y visualización de estadísticas

## Estructura del Proyecto

```
turneropadel/
├── app/                    # Next.js App Router
│   ├── api/               # Endpoints REST API
│   ├── admin/             # Rutas administrativas
│   ├── dashboard/         # Dashboard de usuario
│   ├── [perfil|reservar]/ # Rutas públicas
│   └── layout.tsx         # Layout raíz con Clerk
├── components/            # Componentes React reutilizables
│   ├── admin/            # Componentes administrativos
│   ├── partidos/         # Componentes de lobbies y partidos
│   ├── layout/           # Headers, footers, shells
│   └── ui/               # Componentes base (botones, inputs, etc.)
├── lib/                   # Utilidades y servicios
│   ├── handlers/         # Lógica de negocio
│   ├── repositories/     # Acceso a datos (Prisma)
│   ├── services/         # Servicios de dominio
│   ├── auth.ts           # Autenticación y permisos
│   ├── db.ts             # Cliente Prisma
│   └── types.ts          # Tipos TypeScript compartidos
├── hooks/                 # Custom React hooks
├── prisma/               # Esquema y migraciones
│   ├── schema.prisma     # Modelo de datos
│   └── migrations/       # Historial de cambios BD
└── public/               # Archivos estáticos
```

## Modelo de Datos

El proyecto utiliza Prisma con las siguientes entidades principales:

- **Usuario:** Identidad base (nombre, email, teléfono)
- **Jugador:** Perfil de jugador con reputación y estadísticas
- **Cancha:** Disponibilidad de canchas por turno
- **Turno:** Franjas horarias reservables
- **Reserva:** Confirmación de turno por usuario
- **Lobby:** Partidos en búsqueda de jugadores
- **Solicitud:** Peticiones para unirse a lobbies
- **Evaluación:** Calificación entre jugadores
- **Notificación:** Alertas a usuarios

## Producción

La aplicación está desplegada en **Vercel** y se accede en:

🌐 **[https://proyecto-turnero-ay-d.vercel.app/](https://proyecto-turnero-ay-d.vercel.app/)**

### Deploy automático

El proyecto está configurado con CI/CD automático en Vercel. Cada push a la rama principal dispara automáticamente:

1. Build de la aplicación
2. Ejecución de migraciones Prisma
3. Despliegue en los servidores de Vercel
4. Invalidación de caché de CDN

No requiere acciones manuales después de hacer commit.

## Variables de Entorno

Consultar `.env.example` para la lista completa. Variables críticas:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Conexión PostgreSQL | Sí |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Sí |
| `CLERK_SECRET_KEY` | Clerk secret key | Sí |
| `CLERK_WEBHOOK_SECRET` | Para webhooks de Clerk | Sí |
| `NEXT_PUBLIC_API_URL` | URL base de la API | Sí |

## Deployment

Para desplegar en producción:

1. Configurar variables de entorno en la plataforma de hosting
2. Ejecutar migraciones: `npx prisma migrate deploy`
3. Construir: `npm run build`
4. Iniciar: `npm start`

Soporta deployment en Vercel, Railway, Fly.io u otros servicios Node.js.

## Documentación Adicional

- [API Documentation](./Documentacion/C12E4%20-%20APIs.yaml) - Especificación OpenAPI
- [Estudio de Viabilidad](./Documentacion/EstudioViabilidad/) - Análisis de arquitectura
- [AGENTS.md](./turneropadel/AGENTS.md) - Configuración de agentes personalizados
- [CLAUDE.md](./turneropadel/CLAUDE.md) - Instrucciones para desarrollo con IA

## Soporte

Para reportar issues o solicitar features, crear un issue en el repositorio.
