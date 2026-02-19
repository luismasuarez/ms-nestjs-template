import { ExecutionContext, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, RmqContext } from '@nestjs/microservices';
import { Channel } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { rabbitMqClientConfig } from '../config/rabbitmq.client.config';
import { Queues } from '../constants/queues';

export interface RpcContext {
  channel: Channel;
  originalMsg: any;
  requestId: string;
}

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

  getRpcContext(context: ExecutionContext): RpcContext {
    const ctx = context.switchToRpc().getContext<RmqContext>();
    const channel = ctx.getChannelRef();
    const originalMsg = ctx.getMessage();
    const requestId = originalMsg?.properties?.correlationId || 'unknown';

    return { channel, originalMsg, requestId };
  }

  sendReply(rpcContext: RpcContext, replyData: any) {
    const { channel, originalMsg } = rpcContext;
    const replyTo = originalMsg?.properties?.replyTo;
    const correlationId = originalMsg?.properties?.correlationId;

    if (replyTo) {
      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(replyData)), {
        correlationId,
      });
    } else {
      console.error('No replyTo queue specified in the message');
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
