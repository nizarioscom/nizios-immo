import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePublicLeadDto {
  @IsString()
  @MaxLength(200)
  host!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(30)
  phone!: string;

  @IsIn(['BUY', 'RENT'])
  intent!: 'BUY' | 'RENT';

  @IsString()
  @MaxLength(40)
  budget!: string;

  @IsString()
  @MaxLength(80)
  neighborhood!: string;

  @IsIn(['urgent', 'ce mois-ci', 'simple info'])
  timeline!: 'urgent' | 'ce mois-ci' | 'simple info';

  @IsOptional()
  @IsString()
  @MaxLength(32)
  propertyReference?: string;

  /** Champ piège : un humain ne le remplit pas. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
