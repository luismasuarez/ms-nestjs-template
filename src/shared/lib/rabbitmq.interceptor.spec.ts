import { CallHandler, ExecutionContext } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { firstValueFrom, of, throwError } from 'rxjs';
import { RabbitMQInterceptor } from './rabbitmq.interceptor';

const rpcContext = {
  channel: {},
  originalMsg: { properties: { replyTo: 'reply.queue', correlationId: 'req-1' } },
  requestId: 'req-1',
};

describe('RabbitMQInterceptor', () => {
  it('sends reply on success', async () => {
    const rpcService = {
      getRpcContext: jest.fn().mockReturnValue(rpcContext),
      sendReply: jest.fn(),
    };
    const interceptor = new RabbitMQInterceptor(rpcService as any);
    const handler: CallHandler = {
      handle: () => of({ ok: true }),
    };

    await firstValueFrom(
      interceptor.intercept({} as ExecutionContext, handler),
    );

    expect(rpcService.sendReply).toHaveBeenCalledWith(rpcContext, { ok: true });
  });

  it('sends normalized reply for RpcException payloads', async () => {
    const rpcService = {
      getRpcContext: jest.fn().mockReturnValue(rpcContext),
      sendReply: jest.fn(),
    };
    const interceptor = new RabbitMQInterceptor(rpcService as any);
    const payload = { status: 'error', error: { code: 'X', message: 'Fail' } };
    const handler: CallHandler = {
      handle: () => throwError(() => new RpcException(payload)),
    };

    await expect(
      firstValueFrom(interceptor.intercept({} as ExecutionContext, handler)),
    ).rejects.toBeInstanceOf(RpcException);

    expect(rpcService.sendReply).toHaveBeenCalledWith(rpcContext, payload);
  });

  it('sends internal error reply for unknown errors', async () => {
    const rpcService = {
      getRpcContext: jest.fn().mockReturnValue(rpcContext),
      sendReply: jest.fn(),
    };
    const interceptor = new RabbitMQInterceptor(rpcService as any);
    const handler: CallHandler = {
      handle: () => throwError(() => new Error('Boom')),
    };

    await expect(
      firstValueFrom(interceptor.intercept({} as ExecutionContext, handler)),
    ).rejects.toBeInstanceOf(Error);

    expect(rpcService.sendReply).toHaveBeenCalledWith(rpcContext, {
      statusCode: 500,
      message: 'Boom',
      error: 'INTERNAL_ERROR',
    });
  });
});
