import { Global, Module } from '@nestjs/common';
import { ExampleRpcController } from './example/example.rpc.controller';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { NativeRpcService } from './shared/services/native-rpc.service';
import { PrismaService } from './shared/services/prisma.service';
import { ResponseService } from './shared/services/response.service';

@Global()
@Module({
  controllers: [ExampleRpcController],
  providers: [
    PrismaService,
    ResponseService,
    NativeRpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
  exports: [
    PrismaService,
    ResponseService,
    NativeRpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
})
export class SharedModule { }
