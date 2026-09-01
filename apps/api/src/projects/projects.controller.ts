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
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (search, filter, sort, pagination)' })
  @ApiOkResponse({ description: 'Paginated project list' })
  findAll(@Query() query: QueryProjectDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project details (incl. BOQ, progress, inventory)',
  })
  @ApiParam({ name: 'id', description: 'Project id' })
  @ApiOkResponse({ description: 'Project details' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiCreatedResponse({ description: 'Project created' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project id' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project id' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
