import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { env } from '../config/env';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (no database)' })
  live() {
    return {
      status: 'ok',
      check: 'live',
      service: '@cms/api',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (includes database ping)' })
  ready() {
    return this.ping();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check (includes database ping)' })
  check() {
    return this.ping();
  }

  private async ping() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: '@cms/api',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      check: 'ready',
      service: '@cms/api',
      database: 'up',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }
}
