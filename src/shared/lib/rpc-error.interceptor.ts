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

/**
 * Interceptor para normalizar errores lanzados por handlers RPC.
 *
 * Objetivos:
 * - Capturar errores en flujos RxJS y convertirlos a `RpcException` con la
 *   forma `Response` utilizada por la aplicación.
 * - Traducir errores de validación y excepciones de Nest a respuestas uniformes
 *   que los clientes RPC puedan consumir de forma consistente.
 * - Centralizar el mapeo de mensaje, código y detalles para evitar fugas
 *   de información interna.
 */
@Injectable()
export class RpcErrorInterceptor implements NestInterceptor {
  constructor(private readonly responseService: ResponseService) { }

  /**
   * Intercepta la ejecución del handler y transforma errores en `RpcException`
   * con un `Response` normalizado.
   * @param context Contexto de ejecución de Nest
   * @param next CallHandler que produce el flujo observable de la petición
   * @returns Observable que emite la respuesta normal o lanza RpcException
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const normalized = this.normalizeError(error);
        return throwError(() => new RpcException(normalized));
      }),
    );
  }

  /**
   * Normaliza distintos tipos de error a la forma `Response` usada por la
   * aplicación.
   *
   * Comportamiento:
   * - Si el error es un `RpcException` y ya contiene un `Response`, lo devuelve.
   * - Si el `RpcException` contiene un string u objeto plano, construye un
   *   `Response` con `responseService.error` incluyendo `message`, `code` y
   *   `details` cuando proceda.
   * - Si el error es un error de validación generado por los pipes de Nest,
   *   devuelve `responseService.validationError` con los detalles.
   * - Por defecto, devuelve un error interno genérico.
   *
   * @param error Error recibido desde el flujo o desde Nest
   * @returns Response Objeto normalizado listo para incluirse en RpcException
   */
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
      const details = Array.isArray(error.response.message)
        ? error.response.message
        : [error.response.message];
      return this.responseService.validationError(details);
    }

    const unknownError = error as { message?: string; code?: string } | null;
    const message = unknownError?.message ?? 'Internal server error';
    const code = unknownError?.code ?? ErrorCodes.Internal;

    return this.responseService.error(message, code);
  }

  /**
   * Type guard que detecta si un valor ya tiene la forma `Response` de error
   * utilizada por la aplicación.
   */
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

  /**
   * Type guard que detecta errores de validación del tipo
   * `{ response: { message: ... } }` generados por los pipes de Nest.
   */
  private isValidationError(
    error: unknown,
  ): error is { response: { message: unknown[] | unknown } } {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const maybeError = error as { response?: { message?: unknown } };

    return typeof maybeError.response?.message !== 'undefined';
  }
}
