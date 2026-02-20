export interface MinioConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  staticBucket: string;
  eventsBucket: string;
}

export const getMinioConfig = (): MinioConfig => {
  const minioUrl = process.env.MINIO_URL;

  let endpoint = 'localhost';
  let port = 9000;
  let useSSL = false;

  if (minioUrl) {
    // Parsear MINIO_URL (ej: https://minio-api.steampunker.xyz o http://localhost:9000)
    try {
      const url = new URL(minioUrl);
      endpoint = url.hostname;
      port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 9000);
      useSSL = url.protocol === 'https:';
    } catch (error) {
      console.warn('Invalid MINIO_URL, using default localhost configuration');
    }
  } else {
    // Fallback a configuración tradicional
    endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    port = parseInt(process.env.MINIO_PORT || '9000', 10);
    useSSL = process.env.MINIO_USE_SSL === 'true';
  }

  return {
    endpoint,
    port,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    staticBucket: process.env.MINIO_STATIC_BUCKET || 'static-files',
    eventsBucket: process.env.MINIO_EVENTS_BUCKET || 'events',
  };
};
