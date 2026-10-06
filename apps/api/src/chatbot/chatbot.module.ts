import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [TenantsModule, LeadsModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}