import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { RequestWithId } from './request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const started = Date.now();
    const { method, originalUrl } = request;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${Date.now() - started}ms [${request.requestId ?? '-'}]`,
          );
        },
        error: (err: unknown) => {
          const status =
            err && typeof err === 'object' && 'status' in err
              ? Number((err as { status: number }).status)
              : 500;
          this.logger.warn(
            `${method} ${originalUrl} ${status} ${Date.now() - started}ms [${request.requestId ?? '-'}]`,
          );
        },
      }),
    );
  }
}
