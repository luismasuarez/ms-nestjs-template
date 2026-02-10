import {
  ExecutionContext,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { Channel, Connection, connect } from 'amqplib';
import { randomUUID } from 'crypto';
import EventEmitter from 'events';
import { envs } from '../config/envs';

export interface RpcContext {
  channel: Channel;
  originalMsg: any;
  requestId: string;
}

@Injectable()
export class RpcService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection;
  private channel: Channel;
  private replyQueueName: string;
  private eventEmitter: EventEmitter;

  async onModuleInit() {
    this.connection = await connect(envs.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    const { queue } = await this.channel.assertQueue('', { exclusive: true });
    this.replyQueueName = queue;
    this.eventEmitter = new EventEmitter();

    // Consumir respuestas
    this.channel.consume(
      this.replyQueueName,
      (message) => {
        if (message) {
          this.eventEmitter.emit(
            message.properties.correlationId.toString(),
            message,
          );
        }
      },
      { noAck: true },
    );
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  /**
   * Utilidad para extraer contexto RPC común de interceptors
   * @param context ExecutionContext de NestJS
   * @returns RpcContext con channel, originalMsg y requestId
   */
  getRpcContext(context: ExecutionContext): RpcContext {
    const ctx = context.switchToRpc().getContext<RmqContext>();
    const channel = ctx.getChannelRef();
    const originalMsg = ctx.getMessage();
    const requestId = originalMsg?.properties?.correlationId || 'unknown';

    return { channel, originalMsg, requestId };
  }

  /**
   * Envía una respuesta RPC usando el canal del mensaje original
   * @param rpcContext Contexto RPC obtenido de getRpcContext
   * @param replyData Datos de la respuesta a enviar
   */
  sendReply(rpcContext: RpcContext, replyData: any) {
    const { channel, originalMsg } = rpcContext;
    const replyTo = originalMsg.properties.replyTo;
    const correlationId = originalMsg.properties.correlationId;

    if (replyTo) {
      channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(replyData)), {
        correlationId,
      });
    } else {
      console.error('No replyTo queue specified in the message');
    }
  }

  /**
   * Envía un mensaje RPC a una cola y espera respuesta (equivalente a producer)
   * @param data Datos del mensaje
   * @param queue Cola a la que enviar
   * @returns Promesa con la respuesta
   */
  async produceRpc<T>(data: any, queue: string): Promise<T> {
    const uuid = randomUUID();
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
      replyTo: this.replyQueueName,
      correlationId: uuid,
      expiration: 60000,
      headers: { function: data.operation },
    });

    return new Promise((resolve, reject) => {
      this.eventEmitter.once(uuid, (message) => {
        try {
          const reply = JSON.parse(message.content.toString());
          resolve(reply);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });
  }
}
