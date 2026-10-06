import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsModule } from '../tenants/tenants.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { LeadsController, PublicLeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [AuthModule, TenantsModule, WhatsappModule],
  controllers: [LeadsController, PublicLeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
