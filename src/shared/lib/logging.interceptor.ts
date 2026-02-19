import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { NativeRpcService } from '../services/native-rpc.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');
  private readonly PAYLOAD_MAX_LENGTH = 200;
  private readonly SLOW_THRESHOLD_MS = 500;

  constructor(private readonly rpcService: NativeRpcService) { }

  // Códigos ANSI
  private readonly colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const { originalMsg } = this.rpcService.getRpcContext(context);

    const pattern = context.getHandler().name || 'UnknownPattern';
    const payload = originalMsg?.content
      ? JSON.parse(originalMsg.content.toString())
      : {};

    let payloadString = JSON.stringify(payload);
    if (payloadString.length > this.PAYLOAD_MAX_LENGTH) {
      payloadString = payloadString.slice(0, this.PAYLOAD_MAX_LENGTH) + '...';
    }

    const correlationId = originalMsg?.properties?.correlationId
      ? ` | correlationId: ${originalMsg.properties.correlationId}`
      : '';

    // Log de entrada en cyan
    this.logger.log(
      `${this.colors.cyan}➡️ Pattern: ${pattern} | Payload: ${payloadString}${correlationId}${this.colors.reset}`,
    );

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        const logMessage = `⬅️ Pattern: ${pattern} | Processed in ${ms}ms${correlationId}`;

        if (ms > this.SLOW_THRESHOLD_MS) {
          // Salida lenta en amarillo
          this.logger.warn(
            `${this.colors.yellow}${logMessage}${this.colors.reset}`,
          );
        } else {
          // Salida rápida en verde
          this.logger.log(
            `${this.colors.green}${logMessage}${this.colors.reset}`,
          );
        }
      }),
    );
  }
}
