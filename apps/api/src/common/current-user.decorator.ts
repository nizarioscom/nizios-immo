import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Actor } from './tenant-scope';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): Actor => {
  return ctx.switchToHttp().getRequest().user as Actor;
});
