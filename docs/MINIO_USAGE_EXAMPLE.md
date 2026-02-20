**MinIO Usage Example**

Este documento explica cómo usar el servicio `MinioService` implementado en [src/shared/services/minio.service.ts](src/shared/services/minio.service.ts#L1).

**Resumen**:
- **Qué hace**: `MinioService` encapsula la comunicación con MinIO (creación/verificación de buckets, subir/descargar/eliminar objetos) y expone utilidades para materiales de eventos, archivos estáticos e imágenes de perfil.
- **Comportamiento ante fallos**: Si MinIO no está disponible la aplicación continúa funcionando; las operaciones de subida lanzarán errores informativos. El servicio hace comprobaciones de conexión con timeouts (5s para conexión, 30s para subidas).

**Variables de entorno (recomendadas)**:
- **MINIO_ENDPOINT**: host o IP del servidor MinIO (ej. `minio` o `localhost`).
- **MINIO_PORT**: puerto del servicio (ej. `9000`).
- **MINIO_USE_SSL**: `true` o `false`.
- **MINIO_ACCESS_KEY**: access key.
- **MINIO_SECRET_KEY**: secret key.
- **MINIO_STATIC_BUCKET** / **MINIO_EVENTS_BUCKET**: (opcional) nombres de buckets; el servicio también lee valores desde la función `getMinioConfig()`.

Ejemplo de valores (docker-compose):

- MINIO_ENDPOINT=minio
- MINIO_PORT=9000
- MINIO_USE_SSL=false
- MINIO_ACCESS_KEY=minioadmin
- MINIO_SECRET_KEY=minioadmin

**Buckets y URLs**:
- El servicio crea/verifica dos buckets principales: bucket estático y bucket de eventos.
- Las URLs públicas que genera son relativas a la API del servicio: `/api/files/{bucket}/{objectName}`. Esto evita depender de un BASE_URL absoluto y funciona detrás de proxies como Traefik.

**Métodos principales** (resumen):
- `getFileUrl(bucket, objectName)` : devuelve la ruta relativa a la API (`/api/files/...`).
- `uploadFile(bucket, objectName, fileBuffer, contentType)` : sube buffer y devuelve la URL.
- `uploadEventMaterial(eventId, fileName, fileBuffer, contentType)` : helper para materiales de eventos.
- `uploadStaticFile(folder, fileName, fileBuffer, contentType)` : helper para archivos estáticos.
- `uploadProfileImage(userId, fileName, fileBuffer, contentType)` : sube imagen de perfil.
- `deleteEventMaterial(eventId, fileUrl)` / `deleteProfileImage(fileUrl)` : eliminan objetos a partir de la URL generada por `getFileUrl`.
- `getFile(bucket, objectName)` : descarga y devuelve un `Buffer`.
- `isAvailable()` : indica si MinIO se marcó como disponible tras la inicialización.

**Ejemplo de uso en un controlador (NestJS)**:

```ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../shared/services/minio.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly minio: MinioService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!this.minio.isAvailable()) {
      throw new Error('MinIO no disponible');
    }

    const url = await this.minio.uploadProfileImage(
      'user-id-123',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    return { url };
  }
}
```

**Ejemplo: subir material de evento**:

```ts
const url = await minioService.uploadEventMaterial(
  'event123',
  'slides.pdf',
  fileBuffer,
  'application/pdf',
);
```

**Eliminar a partir de la URL**:

```ts
await minioService.deleteEventMaterial('event123', url);
// o
await minioService.deleteProfileImage(profileUrl);
```

**Notas de depuración y troubleshooting**:
- Si ves logs indicando timeouts o `ECONNREFUSED`, verifica que el contenedor/host de MinIO esté arriba y accesible desde la aplicación.
- En desarrollo con Docker Compose, expón el puerto y usa las mismas credenciales que en la configuración.
- El servicio registra advertencias cuando las credenciales no están configuradas.

**Buenas prácticas**:
- Validar `contentType` antes de subir (ej. imágenes/pdf).
- Sanitizar nombres de archivo si los usas directamente (el servicio ya reemplaza caracteres en `uploadProfileImage`).
- Usar políticas de bucket (lectura pública) solo si es apropiado para tus objetos públicos.

Si necesitas, puedo añadir ejemplos concretos de Docker Compose, tests unitarios o snippets que muestren cómo servir `/api/files/*` desde el gateway del proyecto.
