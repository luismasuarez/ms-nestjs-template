# Plantilla de microservicio (NestJS + RPC)

Plantilla minimalista para construir microservicios con NestJS usando RPC (RabbitMQ), Prisma y buenas prácticas para proyectos internos.

## Propósito

Proveer una base reproducible y configurable para crear nuevos microservicios: arranque rápido, integración con RabbitMQ, acceso a base de datos con Prisma, pruebas y contenedores Docker.

## Características principales

- Comunicación RPC vía RabbitMQ.
- ORM con Prisma y migraciones/seed.
- Estructura modular basada en módulos de NestJS.
- Interceptores y pipes comunes listos para usar.
- Suite mínima de tests unitarios y E2E.

## Requisitos

- Node.js >= 18
- pnpm (recomendado) o npm/yarn
- Docker & Docker Compose (para entornos locales que usan servicios externos)

## Quickstart (desarrollo local)

1. Instalar dependencias:

```bash
pnpm install
```

2. Variables de entorno: copiar y ajustar según tu entorno (usa tu gestor de secretos preferido). Asegúrate de configurar la conexión a RabbitMQ y a la DB.

3. Ejecutar en modo desarrollo:

```bash
pnpm run start:dev
```

4. Ejecutar pruebas unitarias:

```bash
pnpm test
```

## Docker / Servicios locales

Usa `docker-compose.yml` o `docker-compose.local-services.yml` para levantar RabbitMQ, Postgres (u otra DB) y otros servicios locales.

```bash
docker compose up -d
```

Luego ejecutar migraciones y seed (si aplica):

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev
pnpm prisma:seed
```

## Prisma

- Esquema en `src/shared/prisma/schema.prisma`.
- Cliente generado en `src/shared/prisma/generated/prisma`.

Comandos útiles:

```bash
pnpm prisma:generate
pnpm prisma:migrate:dev --name init
pnpm prisma:seed
```

## RabbitMQ / RPC

La configuración del cliente RabbitMQ se encuentra en `src/shared/config/rabbitmq.client.config.ts`. Puedes añadir colas y exchanges en `src/shared/constants/queues.ts`.

Los controladores RPC están en `src/modules/*/*.rpc.controller.ts`.

## Estructura del proyecto (resumen)

- `src/app.module.ts` — módulo raíz.
- `src/main.ts` — punto de entrada.
- `src/modules/` — módulos de dominio (ej.: `example`, `health`).
- `src/shared/` — utilidades compartidas: `config`, `prisma`, `lib` (interceptores, pipes), `constants`, `decorators`, `services`.

## Tests

- Tests unitarios con Jest (archivos `*.spec.ts`).
- Ejecutar todos los tests:

```bash
pnpm test
```

## Lint y formato

Se incluye configuración básica de ESLint y formateo. Ejecuta:

```bash
pnpm lint
pnpm format
```

## CI / Recomendaciones

- Tasks recomendadas en pipelines: `pnpm install`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm prisma:generate`.
- Ejecutar migraciones controladas en entornos de staging/production fuera del contenedor de la app (pipeline separado).

## Cómo usar esta plantilla para un nuevo microservicio

1. Clonar el repositorio como base.
2. Reemplazar nombres y namespaces (`example` → `tu-servicio`) en módulos y en `package.json`.
3. Ajustar `queues.ts` y `rabbitmq.client.config.ts` según las colas/exchanges necesarios.
4. Definir el modelo Prisma y ejecutar migraciones.

## Contribuciones y estilo

- Mantener módulos pequeños y con responsabilidad única.
- Documentar nuevos endpoints RPC en comentarios y tests.

## Licencia

Revisa el fichero `LICENSE` adjunto en el repositorio.

---

Si deseas, puedo:

- Añadir un script `create-service` para clonar y renombrar la plantilla automáticamente.
- Proveer plantillas de GitHub Actions para CI/CD.


