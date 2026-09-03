import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'REGISTER';

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST: 'CREATE',
  PATCH: 'UPDATE',
  PUT: 'UPDATE',
  DELETE: 'DELETE',
};

const PATH_TO_ENTITY: Record<string, string> = {
  '/api/auth/login': 'auth',
  '/api/auth/register': 'user',
  '/api/projects': 'project',
  '/api/materials': 'material',
  '/api/inventory/stock-in': 'inventory',
  '/api/inventory/stock-out': 'inventory',
};

function resolveEntity(path: string): string {
  for (const prefix of Object.keys(PATH_TO_ENTITY)) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      return PATH_TO_ENTITY[prefix];
    }
  }
  return 'unknown';
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: {
    userId?: string | null;
    method: string;
    path: string;
    status: number;
    ip?: string | null;
    entityId?: string | null;
  }) {
    const action: string = METHOD_TO_ACTION[entry.method] ?? 'READ';
    if (action === 'READ') return;

    const entity = resolveEntity(entry.path);

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          action,
          entity,
          entityId: entry.entityId ?? null,
          method: entry.method,
          path: entry.path,
          status: entry.status,
          ip: entry.ip ?? null,
        },
      });
    } catch {
      // Audit logging must never break the request.
    }
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    entity?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: { userId?: string; entity?: string } = {};
    if (params.userId) where.userId = params.userId;
    if (params.entity) where.entity = params.entity;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
