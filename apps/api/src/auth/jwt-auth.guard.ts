import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Actor } from '../common/tenant-scope';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        name: string;
        role: Actor['role'];
        tenantId: string | null;
      }>(header.slice('Bearer '.length));
      const user: Actor = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        tenantId: payload.tenantId ?? null,
      };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
