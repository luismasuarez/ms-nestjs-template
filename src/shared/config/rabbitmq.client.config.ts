import { RmqOptions, Transport } from '@nestjs/microservices';
import { Queues } from '../constants/queues';

type RabbitMqClientConfig = {
  queue: Queues;
};

export const rabbitMqClientConfig = ({
  queue,
}: RabbitMqClientConfig): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL ?? ''],
    queue: queue,
    queueOptions: {
      durable: false,
      exclusive: false,
      passive: true,
    },
    maxConnectionAttempts: -1,
  },
});
