import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transformers';

export class CreateBoqItemDto {
  @ApiProperty({ example: 'Foundation concrete (m³)' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 'm³' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 3500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
