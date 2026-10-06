import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles, RolesGuard } from '../common/roles';
import type { Actor } from '../common/tenant-scope';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get('resolve')
  resolve(@Query('host') host = '') {
    return this.tenants.resolveByHost(host);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  list(@CurrentUser() user: Actor) {
    return this.tenants.list(user);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  sync(@CurrentUser() user: Actor) {
    return this.tenants.syncFromFolders(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@CurrentUser() user: Actor, @Body() body: CreateTenantDto) {
    return this.tenants.createFromFolder(user, body.slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@CurrentUser() user: Actor, @Param('id') id: string) {
    return this.tenants.getById(user, id);
  }
}
