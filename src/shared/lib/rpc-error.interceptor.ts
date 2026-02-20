import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, catchError, throwError } from 'rxjs';
import {
  Response,
  ResponseService,
} from '../services/response.service';

@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  constructor(private readonly responseService: ResponseService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const normalized = this.normalizeError(error);
        return throwError(() => new RpcException(normalized));
      }),
    );
  }

  private normalizeError(error: unknown): Response {
    if (error instanceof RpcException) {
      const rpcError = error.getError();

      if (this.isResponseError(rpcError)) {
        return rpcError;
      }

      if (typeof rpcError === 'string') {
        return this.responseService.error(rpcError, 'RPC_ERROR');
      }

      if (typeof rpcError === 'object' && rpcError !== null) {
        const message =
          'message' in rpcError && typeof rpcError.message === 'string'
            ? rpcError.message
            : 'RPC error';
        const code =
          'code' in rpcError && typeof rpcError.code === 'string'
            ? rpcError.code
            : 'RPC_ERROR';
        const details =
          'details' in rpcError ? (rpcError as Record<string, unknown>).details : rpcError;

        return this.responseService.error(message, code, details);
      }
    }

    const unknownError = error as { message?: string; code?: string } | null;
    const message = unknownError?.message ?? 'Internal server error';
    const code = unknownError?.code ?? 'INTERNAL_ERROR';

    return this.responseService.error(message, code);
  }

  private isResponseError(value: unknown): value is Response {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const response = value as Response;

    return (
      response.status === 'error' &&
      typeof response.error?.message === 'string' &&
      typeof response.error?.code === 'string'
    );
  }
}
