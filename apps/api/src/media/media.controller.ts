import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import { findClientsDir } from '@nizios/db';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const SAFE = /^[a-zA-Z0-9._-]+$/;

const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};

/**
 * Photos de clients/<slug> et fichiers optimisés dans uploads/.
 * Le site Next proxifie /media pour rester sur la même origine.
 */
@Controller('media')
export class MediaController {
  @Get('*')
  file(@Req() req: Request, @Res() res: Response) {
    const url = (req.originalUrl || req.url).split('?')[0] ?? '';
    const relative = decodeURIComponent(url.replace(/^\/media\/?/, ''));
    const parts = relative.split('/').filter(Boolean);
    if (parts.length < 2 || parts.some((part) => !SAFE.test(part))) {
      throw new NotFoundException();
    }
    if (parts[0] !== 'clients' && parts[0] !== 'uploads') {
      throw new NotFoundException();
    }
    const root = path.dirname(findClientsDir());
    const file = path.resolve(root, ...parts);
    const allowed = path.resolve(root, parts[0]) + path.sep;
    if (!file.startsWith(allowed) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new NotFoundException();
    }
    const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(file).pipe(res);
  }
}
