import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({ example: 'Sample Residential Building' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'PRJ-001' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Acme Holdings' })
  @IsString()
  @MaxLength(200)
  clientName: string;

  @ApiProperty({ example: 'Addis Ababa, Ethiopia' })
  @IsString()
  @MaxLength(300)
  location: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 12500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNED })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}
