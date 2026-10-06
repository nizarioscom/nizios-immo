import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Actor } from './tenant-scope';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Array<Actor['role']>) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Array<Actor['role']>>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const user = context.switchToHttp().getRequest().user as Actor | undefined;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Réservé à Nizios.');
    }
    return true;
  }
}
