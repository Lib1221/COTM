import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transformers';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Cement' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'MAT-CEM' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'bag' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Initial stock (defaults to 0). Recorded as a stock-in.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minimumStock?: number;
}
