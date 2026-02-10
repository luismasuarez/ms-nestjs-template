import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { rabbitMqClientConfig } from './shared/config/rabbitmq.client.config';
import { Queues } from './shared/constants/queues';
import { LoggingInterceptor } from './shared/lib/logging.interceptor';
import { RabbitMQInterceptor } from './shared/lib/rabbitmq.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      ...rabbitMqClientConfig({ queue: Queues.EXAMPLE_QUEUE }),
    },
  );

  // Global interceptor for RPC response to gateway
  app.useGlobalInterceptors(app.get(RabbitMQInterceptor));

  app.useGlobalInterceptors(app.get(LoggingInterceptor));

  await app.listen();
}
bootstrap();
