import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, catchError, tap } from 'rxjs';
import { RpcService } from '../services/rpc.service';

@Injectable()
export class RabbitMQInterceptor implements NestInterceptor {
  constructor(private readonly rpcService: RpcService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const rpcContext = this.rpcService.getRpcContext(context);

    return next.handle().pipe(
      tap((response) => {
        this.rpcService.sendReply(rpcContext, response);
      }),
      catchError((error) => {
        let errorResponse: any;
        if (error instanceof RpcException) {
          // RpcException.getError() devuelve el payload original
          const rpcError = error.getError();

          if (typeof rpcError === 'object' && rpcError !== null) {
            errorResponse = rpcError; // Usa directamente el objeto de error
          } else {
            errorResponse = {
              statusCode: 500,
              message: rpcError || error.message,
              error: 'RPC_ERROR',
            };
          }
        } else {
          errorResponse = {
            statusCode: 500,
            message: error.message || 'Internal server error',
            error: 'INTERNAL_ERROR',
          };
        }

        // Envía la respuesta de error
        this.rpcService.sendReply(rpcContext, errorResponse);

        throw error;
      }),
    );
  }
}
