import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('progress')
@Controller('projects/:projectId/progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List progress records for a project' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a progress record to a project' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiCreatedResponse({ description: 'Progress record created' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProgressDto,
  ) {
    return this.service.create(projectId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a progress record' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiParam({ name: 'id', description: 'Progress record id' })
  @ApiNotFoundResponse({ description: 'Progress record not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a progress record' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiParam({ name: 'id', description: 'Progress record id' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.service.remove(projectId, id);
  }
}
