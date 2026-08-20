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
import { BoqService } from './boq.service';
import { CreateBoqItemDto } from './dto/create-boq-item.dto';
import { UpdateBoqItemDto } from './dto/update-boq-item.dto';

@ApiTags('boq')
@Controller('projects/:projectId/boq')
export class BoqController {
  constructor(private readonly service: BoqService) {}

  @Get()
  @ApiOperation({ summary: 'List BOQ items for a project' })
  list(@Param('projectId') projectId: string) {
    return this.service.listByProject(projectId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a BOQ item to a project' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateBoqItemDto) {
    return this.service.create(projectId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a BOQ item' })
  update(@Param('id') id: string, @Body() dto: UpdateBoqItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a BOQ item' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
