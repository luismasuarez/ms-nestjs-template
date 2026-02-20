import { ExecutionContext, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, RmqContext } from '@nestjs/microservices';
import { Channel, connect, Connection } from 'amqplib';
import { firstValueFrom } from 'rxjs';
import { rabbitMqClientConfig } from '../config/rabbitmq.client.config';
import { Queues } from '../constants/queues';
import { randomUUID } from 'crypto';

export interface RpcContext {
  channel: Channel;
  originalMsg: any;
  requestId: string;
}

@Injectable()
export class NativeRpcService implements OnModuleDestroy {
  private client: ClientProxy;

  constructor(private readonly config: ConfigService) {
    const queue = this.config.get<string>('MS_QUEUE') ?? Queues.DEFAULT;
    this.client = ClientProxyFactory.create(
      rabbitMqClientConfig({ queue }) as any,
    );
  }

  /**
   * Envía un mensaje RPC directamente a una cola RabbitMQ y espera la respuesta.
   * Esta implementación no pasa por el gateway, conecta directamente a RabbitMQ.
   * @param data Mensaje a enviar
   * @param queue Cola destino
   * @param timeoutMs Tiempo antes de timeout en ms (por defecto 60000)
   */
  async produceRpc<T = any>(data: any, queue: string, timeoutMs = 60000): Promise<T> {
    const amqpUrl =
      this.config.get<string>('RABBITMQ_URL') || this.config.get<string>('RABBITMQ') || 'amqp://localhost';

    let connection: Connection | undefined;
    let channel: Channel | undefined;

    try {
      connection = await connect(amqpUrl);
      channel = await connection.createChannel();

      const { queue: replyQueue } = await channel.assertQueue('', { exclusive: true });
      const correlationId = randomUUID();

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
        replyTo: replyQueue,
        correlationId,
        expiration: String(timeoutMs),
        headers: { function: data?.operation },
      });

      return await new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup().catch(() => {});
          reject(new Error('RPC timeout'));
        }, timeoutMs);

        channel!.consume(
          replyQueue,
          (msg) => {
            if (!msg) return;
            if (msg.properties.correlationId !== correlationId) return;
            clearTimeout(timer);
            try {
              const parsed = JSON.parse(msg.content.toString());
              cleanup().catch(() => {});
              resolve(parsed as T);
            } catch (err) {
              cleanup().catch(() => {});
              reject(err);
            }
          },
          { noAck: true },
        );

        async function cleanup() {
          try {
            await channel!.close();
          } catch {}
          try {
            await connection!.close();
          } catch {}
        }
      });
    } catch (error) {
      try {
        if (channel) await channel.close();
      } catch {}
      try {
        if (connection) await connection.close();
      } catch {}
      throw error;
    }
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
