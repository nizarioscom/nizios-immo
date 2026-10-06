import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

const tenantA = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  slug: 'elhilal',
  name: 'Elhilal',
  domains: ['localhost', 'elhilal.localhost'],
  defaultLocale: 'fr',
  locales: ['fr', 'ar'],
  branding: { primaryColor: '#14532d' },
  whatsappNumbers: ['+212600000026'],
  config: { pack: 'presence-digitale-immo' },
  content: { fr: { tagline: 'Agence immobilière à Rabat' }, ar: { tagline: 'وكالة' } },
};

const tenantB = {
  ...tenantA,
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  slug: 'autre',
  name: 'Autre Agence',
  domains: ['autre.localhost'],
  whatsappNumbers: ['+212699999999'],
};

describe('HTTP auth et isolation', () => {
  let app: INestApplication;
  let passwordHash: string;
  const tenantReads: string[] = [];

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('demo-password', 4);
    const users = [
      {
        id: 'user-a',
        email: 'admin@elhilal.example',
        name: 'Admin Elhilal',
        role: 'AGENCY_ADMIN' as const,
        tenantId: tenantA.id,
        passwordHash,
      },
      {
        id: 'user-s',
        email: 'admin@nizios.example',
        name: 'Admin Nizios',
        role: 'SUPER_ADMIN' as const,
        tenantId: null,
        passwordHash,
      },
    ];
    const tenants = [tenantA, tenantB];
    const prisma = {
      user: {
        findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          return (
            users.find((user) => user.email === where.email || user.id === where.id) ?? null
          );
        }),
      },
      tenant: {
        findMany: jest.fn(async () => tenants),
        findUnique: jest.fn(async ({ where }: { where: { id?: string } }) => {
          tenantReads.push(where.id ?? '');
          return tenants.find((tenant) => tenant.id === where.id) ?? null;
        }),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function tokenFor(email: string) {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'demo-password' })
      .expect(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.passwordHash).toBeUndefined();
    return res.body.accessToken as string;
  }

  it('refuse un mauvais mot de passe', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@elhilal.example', password: 'mauvais-mot' })
      .expect(401);
  });

  it('un admin Elhilal ne lit pas le tenant B', async () => {
    const token = await tokenFor('admin@elhilal.example');
    tenantReads.length = 0;

    const own = await request(app.getHttpServer())
      .get(`/tenants/${tenantA.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(own.body.name).toBe('Elhilal');
    expect(own.body.whatsappNumbers).toEqual(['+212600000026']);

    await request(app.getHttpServer())
      .get(`/tenants/${tenantB.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(tenantReads).toEqual([tenantA.id]);

    await request(app.getHttpServer())
      .get('/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('le super-admin liste les tenants, la résolution publique ne fuit pas le WhatsApp', async () => {
    const token = await tokenFor('admin@nizios.example');
    const list = await request(app.getHttpServer())
      .get('/tenants')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.map((tenant: { slug: string }) => tenant.slug).sort()).toEqual([
      'autre',
      'elhilal',
    ]);

    const pub = await request(app.getHttpServer())
      .get('/tenants/resolve')
      .query({ host: 'elhilal.localhost:3000' })
      .expect(200);
    expect(pub.body.name).toBe('Elhilal');
    expect(pub.body.whatsappNumbers).toBeUndefined();
    expect(pub.body.config).toBeUndefined();
    expect(pub.body.content.fr.tagline).toBe('Agence immobilière à Rabat');
  });
});
