import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { rabbitMqClientConfig } from '../config/rabbitmq.client.config';
import { Queues } from '../constants/queues';

@Injectable()
export class NativeRpcService implements OnModuleDestroy {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create(
      rabbitMqClientConfig({ queue: Queues.EXAMPLE_QUEUE }) as any,
    );
  }

  async call<T = any>(pattern: string | object, payload: any): Promise<T> {
    return firstValueFrom(this.client.send<T>(pattern, payload));
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
