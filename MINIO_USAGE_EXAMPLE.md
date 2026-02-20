# Guía de Uso del MinioService

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# MinIO (Almacenamiento de archivos S3-compatible)
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=admin1234
```

### ⚠️ Importante: Puerto de MinIO

MinIO usa **dos puertos diferentes**:
- **Puerto 9000**: API de S3 (usa este para `MINIO_URL`)
- **Puerto 9001**: Consola web (para administración)

**Asegúrate de usar el puerto 9000 en la variable `MINIO_URL`.**

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
# Usa la URL pública de tu MinIO (puerto 9000, NO 9001)
MINIO_URL=https://tu-dominio-minio.com
# O si no tienes HTTPS:
MINIO_URL=http://tu-ip-servidor:9000

# Credenciales de tu instancia de MinIO
MINIO_ACCESS_KEY=tu_access_key
MINIO_SECRET_KEY=tu_secret_key
```

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

```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../shared/services/minio.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('files')
export class FilesController {
  constructor(private readonly minioService: MinioService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    })
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.minioService.uploadFile(file);
    return {
      message: 'Archivo subido exitosamente',
      url: fileUrl,
    };
  }
}
```

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
