import { Global, Module } from '@nestjs/common';
import { TenantScopedReader } from '../common/tenant-scoped.reader';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, TenantScopedReader],
  exports: [PrismaService, TenantScopedReader],
})
export class PrismaModule {}
