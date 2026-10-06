import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PropertiesController, PublicPropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [AuthModule, TenantsModule],
  controllers: [PropertiesController, PublicPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
