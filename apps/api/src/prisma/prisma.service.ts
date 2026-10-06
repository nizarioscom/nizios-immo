import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient, withPlatform, withTenant } from '@nizios/db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Requêtes métier isolées par RLS + tenant_id. */
  forTenant<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return withTenant(this, tenantId, fn);
  }

  /** Écritures plateforme (seed, synchro). Les lectures agence ne passent pas ici. */
  forPlatform<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return withPlatform(this, fn);
  }
}
