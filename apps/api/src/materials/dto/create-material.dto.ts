import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Cement' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'MAT-CEM' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'bag' })
  @IsString()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Initial stock (defaults to 0)',
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
