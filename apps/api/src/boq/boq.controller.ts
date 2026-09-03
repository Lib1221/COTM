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
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BoqService } from './boq.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('boq')
@Controller('projects/:projectId/boq')
export class BoqController {
  constructor(private readonly service: BoqService) {}

  @Get()
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List BOQ items for a project' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiOkResponse({ description: 'BOQ items and total value' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a BOQ item to a project' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiCreatedResponse({
    description: 'BOQ item created (total auto-calculated)',
  })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBoqItemDto) {
    return this.service.create(projectId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a BOQ item' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiParam({ name: 'id', description: 'BOQ item id' })
  @ApiNotFoundResponse({ description: 'BOQ item not found' })
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBoqItemDto,
  ) {
    return this.service.update(projectId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a BOQ item' })
  @ApiParam({ name: 'projectId', description: 'Project id' })
  @ApiParam({ name: 'id', description: 'BOQ item id' })
  remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.service.remove(projectId, id);
  }
}
