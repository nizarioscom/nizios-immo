import { IsString, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;
}
