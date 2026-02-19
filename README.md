# MS Service Template NestJS

Template profesional para construcción de microservicios con **NestJS**. Incluye configuración lista para producción con **Prisma ORM**, **PostgreSQL**, **RabbitMQ** y **Docker**.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Docker](#docker)
- [Testing](#testing)
- [Desarrollo](#desarrollo)

## ✨ Características

- ✅ **NestJS 11** - Framework moderno y escalable en TypeScript
- ✅ **Prisma ORM** - Gestión de base de datos type-safe con migraciones automáticas
- ✅ **PostgreSQL** - Base de datos robusta y fiable
- ✅ **RabbitMQ** - Sistema de colas para comunicación asíncrona entre servicios
- ✅ **Docker & Docker Compose** - Despliegue containerizado
- ✅ **TypeScript** - Tipado estricto para mayor seguridad
- ✅ **ESLint & Prettier** - Linting y formateo automático
- ✅ **Jest** - Testing framework integrado
- ✅ **Decoradores Personalizados** - Utilidades para inyección de usuario
- ✅ **Interceptores Globales** - Logging y manejo de RPC centralizado

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 20.x
- **PNPM** >= 9.x (gestor de paquetes recomendado)
- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **PostgreSQL** 16 (opcional si usas Docker)
- **RabbitMQ** (opcional si usas Docker)

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd ms-nestjs-template
```

### 2. Instalar dependencias

```bash
pnpm install
```

Si prefieres usar npm:

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus valores:

```env
# Base de Datos
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ms_examples
POSTGRES_DB=ms_examples
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@localhost:5672/
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin
```

## ⚙️ Configuración

### Estructura de Configuración

Las configuraciones se encuentran en `src/shared/config/`:

- **envs.ts** - Validación de variables de entorno
- **rabbitmq.client.config.ts** - Configuración de RabbitMQ

### Validación de Entorno

Las variables de entorno se validan al iniciar la aplicación usando Joi. Si falta alguna variable requerida, el servicio no arrancará.

## 🏃 Ejecución

### Con Docker Compose (Recomendado)

Levanta todos los servicios (PostgreSQL, RabbitMQ, tu aplicación):

```bash
docker compose up
```

Para modo detached:

```bash
docker compose up -d
```

### Sin Docker

#### Paso 1: Inicia los servicios dependientes

```bash
pnpm run db:compose:up
```

Esto inicia PostgreSQL y RabbitMQ en Docker, pero la aplicación corre localmente.

#### Paso 2: Ejecuta el servidor

En modo desarrollo (con watch):

```bash
pnpm start:dev
```

En modo producción:

```bash
pnpm start:prod
```

En modo debug:

```bash
pnpm start:debug
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm start` | Inicia la aplicación en modo normal |
| `pnpm start:dev` | Inicia en modo desarrollo con auto-reload |
| `pnpm start:debug` | Inicia en modo debug con inspector |
| `pnpm start:prod` | Ejecuta la distribución compilada |
| `pnpm build` | Compila el proyecto a JavaScript |
| `pnpm lint` | Ejecuta ESLint y corrige problemas |
| `pnpm format` | Formatea código con Prettier |
| `pnpm test` | Ejecuta pruebas unitarias |
| `pnpm test:watch` | Ejecuta pruebas en modo watch |
| `pnpm test:cov` | Genera reporte de cobertura |
| `pnpm test:debug` | Ejecuta pruebas en modo debug |
| `pnpm test:e2e` | Ejecuta pruebas end-to-end |
| `pnpm prisma:generate` | Genera el cliente de Prisma |
| `pnpm prisma:migrate` | Ejecuta migraciones pendientes |
| `pnpm prisma:seed` | Ejecuta el script de seed para datos iniciales |
| `pnpm db:compose:up` | Levanta servicios (PostgreSQL, RabbitMQ) |

## 🗂️ Estructura del Proyecto

```
src/
├── main.ts                          # Punto de entrada de la aplicación
├── app.module.ts                    # Módulo raíz
├── shared.module.ts                 # Módulo compartido
└── shared/
    ├── config/                      # Configuraciones
    │   ├── envs.ts                 # Validación de variables de entorno
    │   └── rabbitmq.client.config.ts  # Configuración de RabbitMQ
    ├── constants/                   # Constantes de la aplicación
    │   └── queues.ts               # Nombres de las colas de RabbitMQ
    ├── decorators/                  # Decoradores personalizados
    │   ├── user.decorator.ts       # Decorador para obtener usuario en RPC
    │   └── zod-user.decorator.ts   # Validación con Zod para usuario
    ├── dto/                         # Data Transfer Objects
    │   ├── id-query.dto.ts         # DTO para query de ID
    │   ├── pagination.dto.ts       # DTO para paginación
    │   └── payload.dto.ts          # DTO base para payloads
    ├── lib/                         # Librerías y utilidades
    │   ├── logging.interceptor.ts  # Interceptor para logging
    │   └── rabbitmq.interceptor.ts # Interceptor para transformar respuestas RPC
    └── services/                    # Servicios compartidos
        ├── api-response.service.ts  # Servicio de respuestas estándar
        ├── prisma.service.ts        # Servicio de Prisma
        └── rpc.service.ts           # Servicio para comunicación RPC

prisma/
├── schema.prisma                    # Esquema de base de datos
└── seed.ts                          # Script para datos iniciales

test/                               # Tests e2e
```

## 🗄️ Base de Datos

### Prisma ORM

Este proyecto usa **Prisma** como ORM. El esquema se define en `prisma/schema.prisma`.

### Migraciones

#### Crear una nueva migración

Después de cambiar el esquema:

```bash
pnpm prisma:migrate
```

Se te pedirá un nombre para la migración. Ej: `add_user_table`

#### Aplicar migraciones

Las migraciones se aplican automáticamente al:

- Iniciar con Docker Compose
- Ejecutar `pnpm start:dev`

#### Ver estado de migraciones

```bash
npx prisma migrate status
```

#### Resetear la base de datos (⚠️ Pérdida de datos)

```bash
npx prisma migrate reset
```

### Generar cliente Prisma

```bash
pnpm prisma:generate
```

### Seed (Datos Iniciales)

Para poblar la base de datos con datos iniciales, edita `prisma/seed.ts` y ejecuta:

```bash
pnpm prisma:seed
```

### Prisma Studio

Interfaz visual para explorar y editar datos:

```bash
npx prisma studio
```

Se abrirá en `http://localhost:5555`

## 🐳 Docker

### Archivo docker-compose.yml

Incluye tres servicios:

1. **postgres** - Base de datos PostgreSQL
2. **rabbitmq** - Broker de mensajes (comentado por defecto)
3. **app** - La aplicación NestJS

### Comandos Docker

```bash
# Levantar servicios en background
docker compose up -d

# Ver logs
docker compose logs -f app

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (⚠️ Pérdida de datos)
docker compose down -v

# Reconstruir imagen
docker compose build --no-cache
```

### Variables de Entorno en Docker

Las variables se cargan desde el archivo `.env`. Asegúrate de configurarlas correctamente antes de hacer `docker compose up`.

## 🧪 Testing

### Pruebas Unitarias

```bash
# Ejecutar una sola vez
pnpm test

# Modo watch (se ejecutan al guardar cambios)
pnpm test:watch

# Con cobertura
pnpm test:cov
```

### Pruebas End-to-End

```bash
pnpm test:e2e
```

Configuradas en `test/jest-e2e.json`.

## 👨‍💻 Desarrollo

### Estructura de un Módulo

```typescript
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';

@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [ExampleService],
})
export class ExampleModule {}
```

### Inyección de Dependencias

NestJS usa inyección de dependencias automáticamente:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class ExampleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }
}
```

### Comunicación RPC

Para comunicar con otros servicios a través de RabbitMQ:

```typescript
import { Controller, MessagePattern, Payload } from '@nestjs/common';
import { RpcService } from '../shared/services/rpc.service';

@Controller()
export class ExampleController {
  constructor(
    private readonly exampleService: ExampleService,
    private readonly rpc: RpcService,
  ) {}

  @MessagePattern('example.get')
  async getExample(@Payload() data: any) {
    return this.exampleService.findOne(data.id);
  }
}
```

### Formateo y Linting

```bash
# Linting automático
pnpm lint

# Formateo con Prettier
pnpm format
```

## 📚 Recursos Útiles

- [Documentación NestJS](https://docs.nestjs.com)
- [Documentación Prisma](https://www.prisma.io/docs/)
- [Documentación RabbitMQ](https://www.rabbitmq.com/documentation.html)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)

## 📄 Licencia

UNLICENSED

## 👤 Autor

Creado como template para proyectos de microservicios.

---

**¿Necesitas ayuda?** Revisa los logs de Docker o ejecuta `pnpm start:debug` para más detalles.
