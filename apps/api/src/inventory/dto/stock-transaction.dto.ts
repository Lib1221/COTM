import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transformers';

export class StockInDto {
  @ApiProperty({ description: 'Material id' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'PO-2026-0001' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  reference?: string;
}

export class StockOutDto {
  @ApiProperty({ description: 'Material id' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ description: 'Project id' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'ISS-2026-0001' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  reference?: string;
}
