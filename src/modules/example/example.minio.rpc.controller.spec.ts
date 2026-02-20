import { MinioExampleRpcController } from './minio.example.rpc.controller';

describe('MinioExampleRpcController', () => {
  it('returns a file URL using getFileUrl', async () => {
    const minioService = {
      getFileUrl: jest.fn().mockReturnValue('/api/files/static/my-object.jpg'),
    };

    const controller = new MinioExampleRpcController(minioService as any);

    const response = await controller.handleMinioExample({ action: 'getFileUrl', bucket: 'static', objectName: 'my-object.jpg' });

    expect(minioService.getFileUrl).toHaveBeenCalledWith('static', 'my-object.jpg');
    expect(response).toEqual({ ok: true, url: '/api/files/static/my-object.jpg' });
  });

  it('uploads a profile image via uploadProfileImage', async () => {
    const uploadedUrl = '/api/files/static/profiles/user/123-image.jpg';
    const minioService = {
      uploadProfileImage: jest.fn().mockResolvedValue(uploadedUrl),
    };

    const controller = new MinioExampleRpcController(minioService as any);

    const base64 = Buffer.from('fake-image-bytes').toString('base64');

    const response = await controller.handleMinioExample({
      action: 'uploadProfile',
      userId: 'user-123',
      fileName: 'image.jpg',
      fileBufferBase64: base64,
      contentType: 'image/jpeg',
    });

    expect(minioService.uploadProfileImage).toHaveBeenCalled();
    expect(response).toEqual({ ok: true, url: uploadedUrl });
  });
});
