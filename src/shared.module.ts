import { Global, Module } from '@nestjs/common';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { PrismaService } from './shared/services/prisma.service';
import { ResponseService } from './shared/services/response.service';
import { RpcService } from './shared/services/rpc.service';
import { NativeRpcService } from './shared/services/native-rpc.service';
import { ExampleHttpController } from './example/example.http.controller';
import { ExampleRpcController } from './example/example.rpc.controller';

@Global()
@Module({
  controllers: [ExampleHttpController, ExampleRpcController],
  providers: [
    PrismaService,
    ResponseService,
    RpcService,
    NativeRpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
  exports: [
    PrismaService,
    ResponseService,
    RpcService,
    NativeRpcService,
    LoggingInterceptor,
    RabbitMQInterceptor,
  ],
})
export class SharedModule { }
