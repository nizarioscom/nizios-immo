import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { Actor } from '../common/tenant-scope';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('Identifiants incorrects.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Identifiants incorrects.');
    const actor = this.toActor(user);
    const accessToken = await this.jwt.signAsync({
      sub: actor.id,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      tenantId: actor.tenantId,
    });
    return { accessToken, user: await this.withTenant(actor) };
  }

  async me(actor: Actor) {
    return this.withTenant(actor);
  }

  private async withTenant(actor: Actor) {
    if (!actor.tenantId) return { ...actor, tenant: null };
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: actor.tenantId },
      select: { id: true, slug: true, name: true },
    });
    return { ...actor, tenant };
  }

  private toActor(user: {
    id: string;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'AGENCY_ADMIN';
    tenantId: string | null;
  }): Actor {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
