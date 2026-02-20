# Guía de Uso del MinioService

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# MinIO (Almacenamiento de archivos S3-compatible)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Buckets de MinIO
MINIO_STATIC_BUCKET=static-files
MINIO_EVENTS_BUCKET=events
```

### ⚠️ Importante: Puerto de MinIO

MinIO usa **dos puertos diferentes**:
- **Puerto 9000**: API de S3 (usa este para `MINIO_ENDPOINT` y `MINIO_PORT`)
- **Puerto 9001**: Consola web (para administración)

**Asegúrate de usar el puerto 9000 en las variables de configuración.**

### Para desarrollo local con Docker Compose

Si usas MinIO con Docker, agrega esto a tu `docker-compose.local-services.yml`:

```yaml
minio:
  image: minio/minio
  container_name: minio
  ports:
    - "9000:9000"
    - "9001:9001"
  environment:
    MINIO_ROOT_USER: admin
    MINIO_ROOT_PASSWORD: admin1234
  command: server /data --console-address ":9001"
  volumes:
    - minio_data:/data

volumes:
  minio_data:
```

### Para MinIO en Dokploy u otro servidor externo

Si tienes MinIO desplegado en Dokploy, configura así:

```env
# Configuración del endpoint de MinIO (SIN protocolo http/https)
MINIO_ENDPOINT=tu-dominio-minio.com
MINIO_PORT=9000
MINIO_USE_SSL=true  # true si usas HTTPS, false para HTTP

# Credenciales de tu instancia de MinIO
MINIO_ACCESS_KEY=tu_access_key
MINIO_SECRET_KEY=tu_secret_key

# Buckets personalizados (opcional)
MINIO_STATIC_BUCKET=static-files
MINIO_EVENTS_BUCKET=events
```
el endpoint de MinIO (revisar firewall/red)
4. Usa `MINIO_USE_SSL=true` si tu dominio tiene certificado SSL/TLS
**Notas importantes para Dokploy:**
1. Asegúrate de que el puerto 9000 esté expuesto en tu contenedor de MinIO
2. Si usas un proxy inverso (Traefik, Nginx), configúralo para el puerto 9000
3. Verifica que tu aplicación pueda alcanzar la URL de MinIO (revisar firewall/red)

## 🚀 Cómo Usar el Servicio

### 1. Inyectar el servicio en tu controlador o servicio

```typescript
import { Injectable } from '@nestjs/common';
import { MinioService } from '../shared/services/minio.service';

@Injectable()
export class FileService {
  constructor(private readonly minioService: MinioService) {}

  // Tus métodos aquí
}
```

### 2. Subir un archivo

@Controller('files')
export class FilesController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload/profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string
  ) {
    const fileUrl = await this.minioService.uploadProfileImage(
      userId,
      file.originalname,
      file.buffer,
      file.mimetype
    );
    return {
      message: 'Imagen de perfil subida exitosamente',
      url: fileUrl,
    };
  }

  @Post('upload/static')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStaticFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string
  ) {
    const fileUrl = await this.minioService.uploadStaticFile(
      folder,
      file.originalname,
      file.buffer,
      file.mimetype
    );
    return {Body } from '@nestjs/common';
import { MinioService } from '../shared/services/minio.service';

@Controller('files')
export class FilesController {
  constructor(private readonly minioService: MinioService) {}

  @Delete('profile')
  async deleteProfileImage(@Body('fileUrl') fileUrl: string) {
    await this.minioService.deleteProfileImage(fileUrl);
    return {
      message: 'Imagen de perfil eliminada exitosamente',
    };
  }

  @Delete('event/:eventId/material')
  async deleteEventMaterial(
    @Param('eventId') eventId: string,
    @Body('fileUrl') fileUrl: string
  ) {
    await this.minioService.deleteEventMaterial(eventId, fileUrl);
    return {
      message: 'Material de evento eliminado exitosamente',
bun add @nestjs/platform-express minio multer
bun add -d @types/multer @types/minio

  @Delete('custom')
  async deleteCustomFile(
    @Body('bucket') bucket: string,
    @Body('objectName') objectName: string
  ) {
    await this.minioService.deleteFile(bucket, objectName);
    return {
    Métodos de Inicialización

#### `initializeBuckets(): Promise<void>`
Inicializa los buckets configurados (se ejecuta automáticamente en `onModuleInit`).

### Métodos Básicos

#### `uploadFile(bucket: string, objectName: string, fileBuffer: Buffer, contentType: string): Promise<string>`
Sube un archivo a MinIO y retorna la URL relativa del archivo.

- **Parámetros**: 
  - `bucket`: Nombre del bucket
  - `objectName`: Nombre/ruta del objeto en MinIO
  - `fileBuffer`: Buffer del archivo
  - `contentType`: Tipo MIME del archivo
- **Retorna**: URL relativa del archivo (`/api/files/bucket/objectName`)

#### `deleteFile(bucket: string, objectName: string): Promise<void>`
Elimina un archivo de MinIO.

- **Parámetros**:
  - `bucket`: Nombre del bucket
  - `Sin archivos temporales**: El servicio trabaja directamente con Buffers en memoria, no requiere archivos temporales en disco.

2. **Buckets configurables**: Los buckets se configuran mediante variables de entorno (`MINIO_STATIC_BUCKET` y `MINIO_EVENTS_BUCKET`).

3. **Archivos públicos**: Los archivos en los buckets tienen políticas de lectura pública por defecto.

4. **URLs relativas**: El servicio retorna URLs relativas (`/api/files/bucket/object`) que se resuelven al origen actual, evitando problemas con proxies inversos.

5. **Disponibilidad opcional**: El servicio no bloquea el inicio de la aplicación si MinIO no está disponible, solo registra advertencias en los logs.

6. **Cliente nativo**: Usa el cliente oficial de MinIO (`minio` package) en lugar del SDK de AWS, proporcionando mejor compatibilidad y rendimiento.
- **Parámetros**:
  - `bucket`: Nombre del bucket
  - `objectName`: Nombre/ruta del objeto
- **Retorna**: URL relativa (`/api/files/bucket/objectName`)

### Métodos MinIO connection timeout"

**Causa**: No se pudo conectar a MinIO en el tiempo esperado.

**Solución**: 
- Verifica que `MINIO_ENDPOINT` y `MINIO_PORT` sean correctos
- Asegúrate de que MinIO esté ejecutándose
- Verifica que el puerto 9000 esté accesible desde tu aplicación
  - `fileBuffer`: Buffer del archivo
  - `contentType`: Tipo MIME del archivo
- **Retorna**: URL del archivo

#### `uploadProfileImage(userId: string, fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>`
Sube una imagen de perfil al bucket de archivos estáticos.

- **Parámetros**:
  - `userId`: ID del usuario
  - `fileName`: Nombre del archivo
  - `fileBuffer`: Buffer del archivo
  - `contentType`: Tipo MIME del archivo
- **Retorna**: URL del archivo

#### `deleteProfileImage(fileUrl: string): Promise<void>`
Elimina una imagen de perfil usando su URL.

- **Parámetro**: URL del archivo

### Métodos para Eventos

#### `uploadEventMaterial(eventId: string, fileName: string, fileBuffer: Buffer, contentType: string): Promise<string>`
Sube material de un evento al bucket de eventos.
 o crashea por MinIO

**Solución**: El servicio está diseñado para **NO bloquear el inicio de la aplicación** si MinIO no está disponible. Verás advertencias en los logs:
```
[MinioService] ⚠️  MinIO no está disponible: MinIO connection timeout
[MinioService] ⚠️  MinIO no está disponible. Las funciones de almacenamiento de archivos no estarán disponibles.
```

Si aún crashea, verifica:
1. Las variables de entorno en tu archivo `.env`
2. Que no haya errores de sintaxis en las configuraciones
3. Los logs para identificar el problema específico

### Error: "ECONNREFUSED" o "ECONNRESET"

**Causa**: No se puede establecer conexión con MinIO.

**Solución**:
- Verifica que MinIO esté ejecutándose: `docker ps` o revisa tu servicio en Dokploy
- Verifica que el endpoint y puerto sean correctos
- Si usas Docker, asegúrate de que los contenedores estén en la misma red
- Para servicios externos, verifica firewall y conectividad de redd>`
Elimina material de un evento usando su URL.

- **Parámetros**:
  - `eventId`: ID del evento
  - `fileUrl`: URL del archivo

### Métodos de Utilidad

#### `extractObjectNameFromUrl(fileUrl: string, bucket: string): string | null`
Extrae el nombre del objeto desde una URL de MinIO.

- **Parámetros**:
  - `fileUrl`: URL del archivo
  - `bucket`: Nombre del bucket
- **Retorna**: Nombre del objeto o `null` si no se puede extraer

#### `getStaticBucket(): string`
Obtiene el nombre del bucket de archivos estáticos.

#### `getEventsBucket(): string`
Obtiene el nombre del bucket de eventos.

#### `isAvailable(): boolean`
Verifica si MinIO está disponible.

#### `getClient(): Minio.Client`
Obtiene el cliente de MinIO para operaciones avanzadas
### 3. Eliminar un archivo

```typescript
import { Controller, Delete, Param } from '@nestjs/common';
import { MinioService } from '../shared/services/minio.service';

@Controller('files')
export class FilesController {
  constructor(private readonly minioService: MinioService) {}

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    const deleted = await this.minioService.deleteService(filename);
    return {
      message: 'Archivo eliminado exitosamente',
      deleted,
    };
  }
}
```

## 📦 Instalación de Dependencias

Asegúrate de tener instaladas las dependencias necesarias:

```bash
pnpm install @nestjs/platform-express @aws-sdk/client-s3 multer
pnpm install -D @types/multer
```

## 🔧 Métodos Disponibles

### `uploadFile(filePath: Express.Multer.File): Promise<string>`
Sube un archivo a MinIO y retorna la URL pública del archivo.

- **Parámetro**: Objeto de archivo de Multer
- **Retorna**: URL pública del archivo subido
- **Ejemplo**: `https://localhost:9000/my-public-bucket/abc123.jpg`

### `deleteService(fileName: string): Promise<boolean>`
Elimina un archivo de MinIO por su nombre.

- **Parámetro**: Nombre del archivo (solo el nombre, no la URL completa)
- **Retorna**: `true` si se eliminó correctamente
- **Lanza**: `HttpException` si el nombre es inválido o si falla la eliminación

### `createBucketIfNotExists(bucketName: string): Promise<void>`
Crea un bucket si no existe (se ejecuta automáticamente en `onModuleInit`).

### `makeBucketPublic(bucketName: string): Promise<void>`
Configura un bucket como público (se ejecuta automáticamente en `onModuleInit`).

## 💡 Notas Importantes

1. **Carpeta temporal**: El servicio usa archivos temporales en disco antes de subirlos a MinIO. Asegúrate de crear la carpeta `./uploads` o ajustar la ruta en el interceptor de Multer.

2. **Bucket por defecto**: El servicio usa `my-public-bucket` como bucket por defecto. Si quieres usar otro nombre, puedes modificarlo en el servicio.

3. **Archivos públicos**: Los archivos en `my-public-bucket` son públicamente accesibles por defecto.

4. **URL de retorno**: El servicio retorna la URL completa del archivo, que puedes guardar en tu base de datos.

5. **Extracción del nombre del archivo**: Si guardaste la URL completa y necesitas el nombre del archivo para eliminarlo:
   ```typescript
   const fileName = fileUrl.split('/').pop();
   await this.minioService.deleteService(fileName);
   ```

## 🔍 Solución de Problemas

### Error: "S3 API Requests must be made to API port"

**Causa**: Estás intentando conectarte al puerto incorrecto de MinIO.

**Solución**: 
- Verifica que `MINIO_URL` apunte al **puerto 9000** (API), no al 9001 (consola)
- Correcto: `http://localhost:9000` o `https://minio.tudominio.com`
- Incorrecto: `http://localhost:9001`

### Error: "Connection refused" o "Network error"

**Posibles causas y soluciones**:

1. **MinIO no está ejecutándose**:
   - Para Docker local: `docker compose -f docker-compose.local-services.yml up -d`
   - Para Dokploy: Verifica que el contenedor esté corriendo

2. **Puerto no expuesto**:
   - Verifica que el puerto 9000 esté abierto en el firewall
   - En Dokploy: Asegúrate de que el puerto esté mapeado correctamente

3. **Red incorrecta**:
   - Si usas Docker: Verifica que los contenedores estén en la misma red
   - Para servicios externos: Verifica conectividad con `curl http://tu-minio:9000`

### Error: "Access Denied"

**Solución**: 
- Verifica que `MINIO_ACCESS_KEY` y `MINIO_SECRET_KEY` sean correctos
- Asegúrate de que el usuario tiene permisos para crear buckets y subir archivos

### La aplicación no inicia

**Solución**: Con la nueva versión del servicio, la aplicación **no debería crashear** si MinIO no está disponible. Simplemente verás warnings en los logs:
```
[MinioService] MinIO configuration is incomplete. Skipping initialization.
[MinioService] Application will continue without MinIO functionality
```

Si aún crashea, revisa los logs para identificar el problema específico.
