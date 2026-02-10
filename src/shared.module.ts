import { Global, Module } from '@nestjs/common';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { ApiResponseService } from './shared/services/api-response.service';
import { PrismaService } from './shared/services/prisma.service';
import { RpcService } from './shared/services/rpc.service';

@Global()
@Module({
  providers: [
    PrismaService,
    ApiResponseService,
    RpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
  exports: [
    PrismaService,
    ApiResponseService,
    RpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
})
export class SharedModule {}
