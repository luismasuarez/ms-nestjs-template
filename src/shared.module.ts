import { Global, Module } from '@nestjs/common';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { PrismaService } from './shared/services/prisma.service';
import { ResponseService } from './shared/services/response.service';
import { RpcService } from './shared/services/rpc.service';

@Global()
@Module({
  providers: [
    PrismaService,
    ResponseService,
    RpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
  exports: [
    PrismaService,
    ResponseService,
    RpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
})
export class SharedModule { }
