import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { Actor } from '../common/tenant-scope';
import { CreatePropertyDto, ReorderPhotosDto, UpdatePropertyDto } from './dto/property.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(@CurrentUser() user: Actor, @Query('tenantId') tenantId?: string) {
    return this.properties.list(user, tenantId);
  }

  @Get(':id')
  get(@CurrentUser() user: Actor, @Param('id') id: string, @Query('tenantId') tenantId?: string) {
    return this.properties.get(user, id, tenantId);
  }

  @Post()
  create(@CurrentUser() user: Actor, @Body() body: CreatePropertyDto) {
    return this.properties.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body() body: UpdatePropertyDto,
  ) {
    return this.properties.update(user, id, body);
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  addPhoto(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string },
    @Query('tenantId') tenantId?: string,
  ) {
    return this.properties.addPhoto(user, id, file, tenantId);
  }

  @Post(':id/photos/order')
  reorder(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Body() body: ReorderPhotosDto,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.properties.reorderPhotos(user, id, body.ids ?? [], tenantId);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(
    @CurrentUser() user: Actor,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.properties.removePhoto(user, id, photoId, tenantId);
  }
}

@Controller('public/properties')
export class PublicPropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list(
    @Query('host') host = '',
    @Query('quartier') quartier?: string,
    @Query('type') type?: string,
    @Query('budget') budget?: string,
    @Query('featured') featured?: string,
  ) {
    return this.properties.listPublic(host, { quartier, type, budget, featured });
  }

  @Get(':reference')
  get(
    @Query('host') host = '',
    @Query('locale') locale: 'fr' | 'ar' = 'fr',
    @Param('reference') reference: string,
  ) {
    return this.properties.getPublic(host, reference, locale === 'ar' ? 'ar' : 'fr');
  }
}
