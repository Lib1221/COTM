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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly service: MaterialsService) {}

  @Get()
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List materials (search, low-stock filter, sort, pagination)',
  })
  @ApiOkResponse({ description: 'Paginated material list' })
  findAll(@Query() query: QueryMaterialDto) {
    return this.service.findAll(query);
  }

  @Get('low-stock')
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List low-stock materials' })
  findLowStock() {
    return this.service.findLowStock();
  }

  @Get(':id')
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a material by id' })
  @ApiParam({ name: 'id', description: 'Material id' })
  @ApiNotFoundResponse({ description: 'Material not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a material' })
  @ApiCreatedResponse({ description: 'Material created' })
  create(@Body() dto: CreateMaterialDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a material (stock changes go through inventory)',
  })
  @ApiParam({ name: 'id', description: 'Material id' })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a material' })
  @ApiParam({ name: 'id', description: 'Material id' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
