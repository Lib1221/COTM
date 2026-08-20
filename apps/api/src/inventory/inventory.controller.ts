import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { StockInDto, StockOutDto } from './dto/stock-transaction.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('transactions')
  @ApiOperation({ summary: 'List inventory transactions (filter, sort, pagination)' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.service.findAll(query);
  }

  @Post('stock-in')
  @ApiOperation({ summary: 'Record a stock-in transaction' })
  stockIn(@Body() dto: StockInDto) {
    return this.service.stockIn(dto);
  }

  @Post('stock-out')
  @ApiOperation({ summary: 'Record a stock-out transaction (validates available stock)' })
  stockOut(@Body() dto: StockOutDto) {
    return this.service.stockOut(dto);
  }
}
