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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('progress')
@Controller('projects/:projectId/progress')
export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'List progress records for a project' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a progress record to a project' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateProgressDto) {
    return this.service.create(projectId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a progress record' })
  update(@Param('id') id: string, @Body() dto: UpdateProgressDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a progress record' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
