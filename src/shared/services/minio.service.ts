import { CreateBucketCommand, DeleteObjectCommand, PutBucketPolicyCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createReadStream } from "fs";

@Injectable()
export class MinioService implements OnModuleInit {
  private logger = new Logger(MinioService.name);
  private s3: S3Client;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    try {
      const minioUrl = this.configService.get<string>('MINIO_URL');
      const accessKeyId = this.configService.get<string>('MINIO_ACCESS_KEY');
      const secretAccessKey = this.configService.get<string>('MINIO_SECRET_KEY');

      if (!minioUrl || !accessKeyId || !secretAccessKey) {
        this.logger.warn('MinIO configuration is incomplete. Skipping initialization.');
        this.logger.warn('Required: MINIO_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY');
        return;
      }

      this.logger.log(`Connecting to MinIO at ${minioUrl}`);

      this.s3 = new S3Client({
        region: 'us-east-1',
        endpoint: minioUrl,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });

      await this.createBucketIfNotExists('my-public-bucket');
      await this.makeBucketPublic('my-public-bucket');

      this.logger.log('MinIO service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MinIO service:', error.message);
      this.logger.error('Please check your MinIO configuration (URL, credentials, and network connectivity)');
      this.logger.warn('Application will continue without MinIO functionality');
    }
  }

  async createBucketIfNotExists(bucketName: string) {
    try {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      this.logger.log(`Bucket '${bucketName}' created successfully`);
    } catch (err) {
      if (err?.name === 'BucketAlreadyOwnedByYou' || err?.name === 'BucketAlreadyExists') {
        this.logger.log(`Bucket '${bucketName}' already exists`);
      } else {
        this.logger.error(`Error creating bucket '${bucketName}':`, err.message);
        throw err;
      }
    }
  }

  async makeBucketPublic(bucketName: string) {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicRead',
          Effect: 'Allow',
          Principal: '*',
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    });

    try {
      await this.s3.send(command);
      this.logger.log(`Bucket '${bucketName}' is now public`);
    } catch (err) {
      this.logger.error(`Error setting bucket policy for '${bucketName}':`, err.message);
      throw err;
    }
  }

  async uploadFile(filePath: any) {
    try {
      const fileContent = createReadStream(filePath.path);

      const command = new PutObjectCommand({
        Bucket: "my-public-bucket",
        Key: filePath.filename,
        Body: fileContent,
        ContentType: filePath.mimetype,

      });

      await this.s3.send(command);

      const publicUrl = `${this.configService.get('MINIO_URL')}/my-public-bucket/${filePath.filename}`;
      this.logger.log(`File uploaded successfully: ${filePath.filename}`);

      return publicUrl;
    } catch (err) {
      this.logger.error('Error uploading file:', err.message);
      throw new HttpException('Failed to upload file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteService(fileName: string) {
    if (!fileName || typeof fileName !== 'string') {
      throw new HttpException('Invalid file name', HttpStatus.BAD_REQUEST);
    }
    try {
      const command = new DeleteObjectCommand({
        Bucket: "my-public-bucket",
        Key: fileName,
      });
      await this.s3.send(command);
      this.logger.log(`File deleted successfully: ${fileName}`);
      return true;
    } catch (err) {
      this.logger.error(`Error deleting file '${fileName}':`, err.message);
      throw new HttpException('Cannot delete file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}