import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const REFERENCE = /^[A-Za-z0-9-]{2,32}$/;

export class CreatePropertyDto {
  @Matches(REFERENCE)
  reference!: string;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionAr?: string;

  @IsOptional()
  @IsIn(['PUBLISHED', 'UNPUBLISHED'])
  status?: 'PUBLISHED' | 'UNPUBLISHED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMad?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  neighborhood?: string;

  @IsOptional()
  @IsIn(['BUY', 'RENT'])
  transaction?: 'BUY' | 'RENT';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  surfaceM2?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class UpdatePropertyDto {
  @IsOptional()
  @Matches(REFERENCE)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  descriptionAr?: string;

  @IsOptional()
  @IsIn(['PUBLISHED', 'UNPUBLISHED'])
  status?: 'PUBLISHED' | 'UNPUBLISHED';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceMad?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  neighborhood?: string;

  @IsOptional()
  @IsIn(['BUY', 'RENT'])
  transaction?: 'BUY' | 'RENT';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  surfaceM2?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  tenantId?: string;
}

export class ReorderPhotosDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
