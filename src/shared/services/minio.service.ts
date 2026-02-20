import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";
import { getMinioConfig } from "../config/minio.config";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private minioAvailable = false;

  private readonly STATIC_BUCKET: string;
  private readonly EVENTS_BUCKET: string;
  private readonly MINIO_ENDPOINT: string;
  private readonly MINIO_PORT: number;
  private readonly MINIO_USE_SSL: boolean;
  private readonly MINIO_ACCESS_KEY: string;
  private readonly MINIO_SECRET_KEY: string;

  constructor() {
    // Configuración de MinIO desde variables de entorno usando process.env
    const config = getMinioConfig();

    this.MINIO_ENDPOINT = config.endpoint;
    this.MINIO_PORT = config.port;
    this.MINIO_USE_SSL = config.useSSL;
    this.MINIO_ACCESS_KEY = config.accessKey;
    this.MINIO_SECRET_KEY = config.secretKey;
    this.STATIC_BUCKET = config.staticBucket;
    this.EVENTS_BUCKET = config.eventsBucket;

    // Inicializar cliente MinIO
    this.minioClient = new Minio.Client({
      endPoint: this.MINIO_ENDPOINT,
      port: this.MINIO_PORT,
      useSSL: this.MINIO_USE_SSL,
      accessKey: this.MINIO_ACCESS_KEY,
      secretKey: this.MINIO_SECRET_KEY,
    });
  }

  async onModuleInit() {
    await this.initializeBuckets();
  }

  /**
   * Verificar conexión a MinIO
   */
  private async checkMinIOConnection(): Promise<boolean> {
    try {
      this.logger.log(`Intentando conectar a MinIO en ${this.MINIO_ENDPOINT}:${this.MINIO_PORT}...`);

      // Intentar listar buckets con timeout
      await Promise.race([
        this.minioClient.listBuckets(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("MinIO connection timeout")), 5000)
        ),
      ]);

      this.logger.log(`Conexión exitosa a MinIO en ${this.MINIO_ENDPOINT}:${this.MINIO_PORT}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`MinIO no está disponible: ${errorMessage}`);
      this.logger.warn(`   Endpoint configurado: ${this.MINIO_ENDPOINT}:${this.MINIO_PORT}`);
      this.logger.warn(`   SSL: ${this.MINIO_USE_SSL}`);
      this.logger.warn(`   Access Key: ${this.MINIO_ACCESS_KEY ? '***configurado***' : 'NO CONFIGURADO'}`);
      this.logger.warn(`   Secret Key: ${this.MINIO_SECRET_KEY ? '***configurado***' : 'NO CONFIGURADO'}`);
      return false;
    }
  }

  /**
   * Inicializar buckets si no existen (no falla si MinIO no está disponible)
   */
  async initializeBuckets(): Promise<void> {
    try {
      const isConnected = await this.checkMinIOConnection();
      if (!isConnected) {
        this.minioAvailable = false;
        this.logger.warn("MinIO no está disponible. Las funciones de almacenamiento de archivos no estarán disponibles.");
        return;
      }

      this.minioAvailable = true;

      // Verificar y crear bucket de archivos estáticos
      await this.ensureBucketExists(this.STATIC_BUCKET);

      // Verificar y crear bucket de eventos
      await this.ensureBucketExists(this.EVENTS_BUCKET);

      this.logger.log("MinIO buckets inicializados correctamente");
    } catch (error) {
      this.minioAvailable = false;
      this.logger.error("Error initializing MinIO buckets:", error);
      // No lanzar el error, solo loggear
      // Esto permite que la aplicación continúe funcionando sin MinIO
    }
  }

  /**
   * Asegurar que un bucket exista y tenga política pública
   */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    const exists = await this.minioClient.bucketExists(bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(bucketName, "us-east-1");
      this.logger.log(`Bucket creado: ${bucketName}`);

      // Configurar política pública para lectura
      try {
        await this.minioClient.setBucketPolicy(
          bucketName,
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          })
        );
      } catch (policyError) {
        this.logger.warn(`No se pudo configurar la política del bucket ${bucketName}:`, policyError);
      }
    }
  }

  /**
   * Obtener URL pública de un archivo
   * Usa ruta relativa para que funcione desde cualquier origen (localhost, traefik, etc.)
   */
  getFileUrl(bucket: string, objectName: string): string {
    // Ruta relativa: se resuelve al origen actual, evita problemas con BASE_URL
    return `/api/files/${bucket}/${objectName}`;
  }

  /**
   * Subir archivo a MinIO
   */
  async uploadFile(
    bucket: string,
    objectName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    // Verificar si MinIO está disponible
    if (!this.minioAvailable) {
      const isConnected = await this.checkMinIOConnection();
      if (!isConnected) {
        throw new Error(
          `MinIO no está disponible. Verifica que el servicio esté corriendo en ${this.MINIO_ENDPOINT}:${this.MINIO_PORT}`
        );
      }
      this.minioAvailable = true;
    }

    try {
      // Intentar con timeout
      await Promise.race([
        this.minioClient.putObject(bucket, objectName, fileBuffer, fileBuffer.length, {
          "Content-Type": contentType,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("MinIO upload timeout")), 30000)
        ),
      ]);
      return this.getFileUrl(bucket, objectName);
    } catch (error) {
      this.minioAvailable = false; // Marcar como no disponible en caso de error
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error uploading file to MinIO (${this.MINIO_ENDPOINT}:${this.MINIO_PORT}):`, errorMessage);

      // Proporcionar mensaje de error más útil
      if (errorMessage.includes("ECONNRESET") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error(
          `No se pudo conectar a MinIO en ${this.MINIO_ENDPOINT}:${this.MINIO_PORT}. Verifica que el servicio esté corriendo y accesible.`
        );
      }

      throw error;
    }
  }

  /**
   * Eliminar archivo de MinIO
   */
  async deleteFile(bucket: string, objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucket, objectName);
    } catch (error) {
      this.logger.error("Error deleting file from MinIO:", error);
      throw error;
    }
  }

  /**
   * Obtener archivo de MinIO
   */
  async getFile(bucket: string, objectName: string): Promise<Buffer> {
    try {
      const dataStream = await this.minioClient.getObject(bucket, objectName);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on("data", (chunk) => chunks.push(chunk));
        dataStream.on("end", () => resolve(Buffer.concat(chunks)));
        dataStream.on("error", reject);
      });
    } catch (error) {
      this.logger.error("Error getting file from MinIO:", error);
      throw error;
    }
  }

  /**
   * Subir material de evento
   */
  async uploadEventMaterial(
    eventId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const objectName = `events/${eventId}/materials/${Date.now()}-${fileName}`;
    return this.uploadFile(this.EVENTS_BUCKET, objectName, fileBuffer, contentType);
  }

  /**
   * Eliminar material de evento
   */
  async deleteEventMaterial(eventId: string, fileUrl: string): Promise<void> {
    const apiFilesMatch = fileUrl.match(/\/api\/files\/events\/(.+)$/);

    if (!apiFilesMatch || !apiFilesMatch[1]) {
      throw new Error(`URL inválida para eliminar material: ${fileUrl}. Se espera formato /api/files/events/...`);
    }

    const objectName = apiFilesMatch[1];
    await this.deleteFile(this.EVENTS_BUCKET, objectName);
  }

  /**
   * Subir archivo estático general
   */
  async uploadStaticFile(
    folder: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const objectName = `${folder}/${Date.now()}-${fileName}`;
    return this.uploadFile(this.STATIC_BUCKET, objectName, fileBuffer, contentType);
  }

  /**
   * Subir imagen de perfil
   */
  async uploadProfileImage(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<string> {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectName = `profiles/${userId}/${Date.now()}-${sanitizedFileName}`;
    return this.uploadFile(this.STATIC_BUCKET, objectName, fileBuffer, contentType);
  }

  /**
   * Extraer el nombre del objeto desde una URL de MinIO
   */
  extractObjectNameFromUrl(fileUrl: string, bucket: string): string | null {
    // Formato esperado: http://host:port/api/files/static-files/profiles/user/file.jpg
    // o: /api/files/static-files/profiles/user/file.jpg
    const apiFilesMatch = fileUrl.match(/\/api\/files\/[^/]+\/(.+)$/);

    if (apiFilesMatch && apiFilesMatch[1]) {
      // Remover query params si existen
      return apiFilesMatch[1].split('?')[0];
    }

    // Intentar con formato directo del bucket
    const bucketMatch = fileUrl.match(new RegExp(`/${bucket}/(.+)$`));
    if (bucketMatch && bucketMatch[1]) {
      return bucketMatch[1].split('?')[0];
    }

    return null;
  }

  /**
   * Eliminar imagen de perfil desde URL
   */
  async deleteProfileImage(fileUrl: string): Promise<void> {
    const objectName = this.extractObjectNameFromUrl(fileUrl, this.STATIC_BUCKET);
    if (!objectName) {
      throw new Error(`URL inválida para eliminar imagen de perfil: ${fileUrl}`);
    }
    await this.deleteFile(this.STATIC_BUCKET, objectName);
  }

  /**
   * Getters para acceder a propiedades del servicio
   */
  getStaticBucket(): string {
    return this.STATIC_BUCKET;
  }

  getEventsBucket(): string {
    return this.EVENTS_BUCKET;
  }

  isAvailable(): boolean {
    return this.minioAvailable;
  }

  getClient(): Minio.Client {
    return this.minioClient;
  }
}