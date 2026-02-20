import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MinioService } from 'src/shared/services/minio.service';

@Controller()
export class MinioExampleRpcController {
  constructor(private readonly minioService: MinioService) {}

  @MessagePattern('example.minio')
  async handleMinioExample(@Payload() data: any) {
    const { action } = data || {};

    if (action === 'getFileUrl') {
      const { bucket, objectName } = data;
      return { ok: true, url: this.minioService.getFileUrl(bucket, objectName) };
    }

    if (action === 'uploadProfile') {
      const { userId, fileName, fileBufferBase64, contentType } = data;
      const buffer = Buffer.from(fileBufferBase64 || '', 'base64');
      const url = await this.minioService.uploadProfileImage(userId, fileName, buffer, contentType);
      return { ok: true, url };
    }

    return { ok: false, message: 'unsupported action' };
  }
}
