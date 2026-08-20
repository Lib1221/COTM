import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProgressDto {
  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Foundation work completed' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 35, minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercent: number;

  @ApiPropertyOptional({ example: 'Concrete poured and cured.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
