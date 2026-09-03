import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      path: string;
      url: string;
      user?: AuthUser;
      ip: string;
    }>();
    const method = request.method;

    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          const responseCtx = context.switchToHttp().getResponse<{
            statusCode: number;
          }>();
          const path = request.url?.split('?')[0] ?? request.path;
          const entityId =
            response && typeof response === 'object' && 'id' in response
              ? String((response as { id: unknown }).id)
              : null;

          void this.auditService.log({
            userId: request.user?.id ?? null,
            method,
            path,
            status: responseCtx.statusCode ?? 200,
            ip: request.ip,
            entityId,
          });
        },
        error: (err: unknown) => {
          const path = request.url?.split('?')[0] ?? request.path;
          const status =
            err && typeof err === 'object' && 'status' in err
              ? (err as { status: number }).status
              : 500;
          void this.auditService.log({
            userId: request.user?.id ?? null,
            method,
            path,
            status,
            ip: request.ip,
          });
        },
      }),
    );
  }
}
