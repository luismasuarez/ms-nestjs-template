import { Global, Module } from '@nestjs/common';
import { ExampleRpcController } from './modules/example/example.rpc.controller';
import { HealthRpcController } from './modules/health/health.rpc.controller';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { RpcErrorInterceptor } from './shared/lib/rpc-error.interceptor';
import { MinioService } from './shared/services/minio.service';
import { NativeRpcService } from './shared/services/native-rpc.service';
import { PrismaService } from './shared/services/prisma.service';
import { ResponseService } from './shared/services/response.service';

@Global()
@Module({
  controllers: [ExampleRpcController, HealthRpcController],
  providers: [
    PrismaService,
    ResponseService,
    NativeRpcService,
    MinioService,
    LoggingInterceptor,
    RabbitMQInterceptor,
    RpcErrorInterceptor,
  ],
  exports: [
    PrismaService,
    ResponseService,
    NativeRpcService,
    MinioService,
    LoggingInterceptor,
    RabbitMQInterceptor,
    RpcErrorInterceptor,
  ],
})
export class SharedModule { }
