import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { rabbitMqClientConfig } from './shared/config/rabbitmq.client.config';
import { Queues } from './shared/constants/queues';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';
import { RpcErrorInterceptor } from './shared/lib/rpc-error.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      ...rabbitMqClientConfig({ queue: Queues.DEFAULT }),
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptor for RPC response to gateway
  app.useGlobalInterceptors(app.get(RabbitMQInterceptor));

  app.useGlobalInterceptors(app.get(RpcErrorInterceptor));

  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  await app.listen();
}
bootstrap();
