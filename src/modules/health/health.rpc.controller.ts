import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import path from 'node:path';
import { ResponseService } from '../../shared/services/response.service';

const { name, version } = require(path.resolve(process.cwd(), 'package.json')) as {
  name: string;
  version: string;
};

@Controller()
export class HealthRpcController {
  constructor(private readonly responseService: ResponseService) { }

  @MessagePattern('health.check')
  healthCheck() {
    return this.responseService.success({
      status: 'ok',
      service: name,
      version,
    });
  }
}
