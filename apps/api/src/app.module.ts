import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { HealthModule } from './health/health.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { ReportsModule } from './reports/reports.module';
import { SeoModule } from './seo/seo.module';
import { TenantsModule } from './tenants/tenants.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    PropertiesModule,
    LeadsModule,
    ChatbotModule,
    WhatsappModule,
    ReportsModule,
    MediaModule,
    SeoModule,
  ],
})
export class AppModule {}
