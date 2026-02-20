import { CallHandler, ExecutionContext } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { firstValueFrom, throwError } from 'rxjs';
import { ErrorCodes, Response, ResponseService } from '../services/response.service';
import { RpcErrorInterceptor } from './rpc-error.interceptor';

describe('RpcErrorInterceptor', () => {
  let interceptor: RpcErrorInterceptor;
  let responseService: ResponseService;

  beforeEach(() => {
    responseService = new ResponseService();
    interceptor = new RpcErrorInterceptor(responseService);
  });

  const run = async (error: unknown) => {
    const handler: CallHandler = {
      handle: () => throwError(() => error),
    };

    try {
      await firstValueFrom(
        interceptor.intercept({} as ExecutionContext, handler),
      );
    } catch (err) {
      return err;
    }
  };

  it('passes through already normalized Response errors', async () => {
    const payload = responseService.error('Bad', ErrorCodes.BadRequest);
    const err = await run(new RpcException(payload));

    expect(err).toBeInstanceOf(RpcException);
    expect((err as RpcException).getError()).toEqual(payload);
  });

  it('normalizes RpcException with string payload', async () => {
    const err = await run(new RpcException('Boom'));
    const payload = (err as RpcException).getError() as Response;

    expect(payload.status).toBe('error');
    expect(payload.error?.code).toBe(ErrorCodes.Rpc);
    expect(payload.error?.message).toBe('Boom');
  });

  it('normalizes RpcException with object payload', async () => {
    const err = await run(
      new RpcException({ code: 'CUSTOM', message: 'Fail', details: { a: 1 } }),
    );
    const payload = (err as RpcException).getError() as Response;

    expect(payload.status).toBe('error');
    expect(payload.error?.code).toBe('CUSTOM');
    expect(payload.error?.message).toBe('Fail');
    expect(payload.error?.details).toEqual({ a: 1 });
  });

  it('normalizes validation errors', async () => {
    const err = await run({ response: { message: ['name is required'] } });
    const payload = (err as RpcException).getError() as Response;

    expect(payload.status).toBe('error');
    expect(payload.error?.code).toBe(ErrorCodes.Validation);
    expect(payload.error?.message).toBe('Validation failed');
    expect(payload.error?.details).toEqual(['name is required']);
  });

  it('normalizes unknown errors', async () => {
    const err = await run(new Error('Unexpected'));
    const payload = (err as RpcException).getError() as Response;

    expect(payload.status).toBe('error');
    expect(payload.error?.code).toBe(ErrorCodes.Internal);
    expect(payload.error?.message).toBe('Unexpected');
  });
});
