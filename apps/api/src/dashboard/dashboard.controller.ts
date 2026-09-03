import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Dashboard overview (project totals, inventory, performance)',
  })
  getOverview() {
    return this.service.getOverview();
  }
}
