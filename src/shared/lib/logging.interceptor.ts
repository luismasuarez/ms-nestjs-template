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
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly PAYLOAD_MAX_LENGTH = 200;
  private readonly SLOW_THRESHOLD_MS = 500;

  constructor(private readonly rpcService: NativeRpcService) { }

  private readonly colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startedAt = Date.now();
    const { originalMsg } = this.rpcService.getRpcContext(context);

    const pattern = this.getPattern(context);
    const payload = this.getPayload(originalMsg?.content);
    const payloadString = this.truncate(JSON.stringify(payload));
    const correlationId = this.getCorrelationId(originalMsg?.properties?.correlationId);

    this.logIn(pattern, payloadString, correlationId);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        this.logOut(pattern, ms, correlationId);
      }),
    );
  }

  private getPattern(context: ExecutionContext): string {
    return context.getHandler().name || 'UnknownPattern';
  }

  private getPayload(content?: Buffer): unknown {
    if (!content) return {};
    try {
      return JSON.parse(content.toString());
    } catch {
      return { raw: content.toString() };
    }
  }

  private truncate(value: string): string {
    if (value.length <= this.PAYLOAD_MAX_LENGTH) return value;
    return value.slice(0, this.PAYLOAD_MAX_LENGTH) + '...';
  }

  private getCorrelationId(id?: string): string {
    return id ? ` | correlationId: ${id}` : '';
  }

  private logIn(pattern: string, payload: string, correlationId: string): void {
    this.logger.log(
      `${this.colors.cyan}➡️ Pattern: ${pattern} | Payload: ${payload}${correlationId}${this.colors.reset}`,
    );
  }

  private logOut(pattern: string, ms: number, correlationId: string): void {
    const message = `⬅️ Pattern: ${pattern} | Processed in ${ms}ms${correlationId}`;
    if (ms > this.SLOW_THRESHOLD_MS) {
      this.logger.warn(`${this.colors.yellow}${message}${this.colors.reset}`);
    } else {
      this.logger.log(`${this.colors.green}${message}${this.colors.reset}`);
    }
  }
}