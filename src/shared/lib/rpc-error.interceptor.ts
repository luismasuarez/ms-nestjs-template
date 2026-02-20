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
  ErrorCodes,
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
        return this.responseService.error(rpcError, ErrorCodes.Rpc);
      }

      if (typeof rpcError === 'object' && rpcError !== null) {
        const message =
          'message' in rpcError && typeof rpcError.message === 'string'
            ? rpcError.message
            : 'RPC error';
        const code =
          'code' in rpcError && typeof rpcError.code === 'string'
            ? rpcError.code
            : ErrorCodes.Rpc;
        const details =
          'details' in rpcError ? (rpcError as Record<string, unknown>).details : rpcError;

        return this.responseService.error(message, code, details);
      }
    }

    if (this.isValidationError(error)) {
      return this.responseService.validationError(error.response.message);
    }

    const unknownError = error as { message?: string; code?: string } | null;
    const message = unknownError?.message ?? 'Internal server error';
    const code = unknownError?.code ?? ErrorCodes.Internal;

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

  private isValidationError(
    error: unknown,
  ): error is { response: { message: unknown[] } } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { response?: { message?: unknown } };

    return Array.isArray(maybeError.response?.message);
  }
}
