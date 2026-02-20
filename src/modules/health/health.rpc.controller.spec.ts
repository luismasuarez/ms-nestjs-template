import path from 'node:path';
import { HealthRpcController } from './health.rpc.controller';
import { ResponseService } from '../../shared/services/response.service';

describe('HealthRpcController', () => {
  it('returns service status with name and version', () => {
    const responseService = new ResponseService();
    const controller = new HealthRpcController(responseService);
    const pkg = require(path.resolve(process.cwd(), 'package.json')) as {
      name: string;
      version: string;
    };

    const response = controller.healthCheck();

    expect(response.status).toBe('success');
    expect(response.data).toEqual({
      status: 'ok',
      service: pkg.name,
      version: pkg.version,
    });
    expect(response.meta?.timestamp).toEqual(expect.any(String));
  });
});
