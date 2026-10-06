import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { clientIp } from '../common/rate-limit';
import { CurrentUser } from '../common/current-user.decorator';
import type { Actor } from '../common/tenant-scope';
import { CreatePublicLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  list(@CurrentUser() user: Actor, @Query('tenantId') tenantId?: string) {
    return this.leads.list(user, tenantId);
  }
}

@Controller('public/leads')
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() body: CreatePublicLeadDto, @Req() req: Request, @Headers('x-forwarded-for') forwarded?: string) {
    const ip = clientIp({ 'x-forwarded-for': forwarded }, req.ip);
    return this.leads.createFromSite(body, ip);
  }
}
