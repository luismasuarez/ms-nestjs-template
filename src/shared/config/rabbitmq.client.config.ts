import { RmqOptions, Transport } from '@nestjs/microservices';
import { Queues } from '../constants/queues';
import { envs } from './envs';

type RabbitMqClientConfig = {
  queue: Queues;
};

export const rabbitMqClientConfig = ({
  queue,
}: RabbitMqClientConfig): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [envs.RABBITMQ_URL],
    queue: queue,
    queueOptions: {
      durable: false,
      exclusive: false,
      passive: true,
    },
    maxConnectionAttempts: -1,
  },
});
