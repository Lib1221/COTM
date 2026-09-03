import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { StockInDto, StockOutDto } from './dto/stock-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('transactions')
  @Roles(UserRole.VIEWER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'List inventory transactions (filter, sort, pagination)',
  })
  findAll(@Query() query: QueryInventoryDto) {
    return this.service.findAll(query);
  }

  @Post('stock-in')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record a stock-in transaction' })
  @ApiCreatedResponse({ description: 'Stock increased' })
  stockIn(@Body() dto: StockInDto) {
    return this.service.stockIn(dto);
  }

  @Post('stock-out')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Record a stock-out transaction (validates available stock)',
  })
  @ApiCreatedResponse({ description: 'Stock decreased' })
  @ApiBadRequestResponse({ description: 'Quantity exceeds available stock' })
  stockOut(@Body() dto: StockOutDto) {
    return this.service.stockOut(dto);
  }
}
