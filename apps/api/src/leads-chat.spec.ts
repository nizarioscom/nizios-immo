import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { WhatsappService } from './whatsapp/whatsapp.service';

const tenantA = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  slug: 'elhilal',
  name: 'Elhilal',
  domains: ['localhost', 'elhilal.localhost'],
  defaultLocale: 'fr',
  locales: ['fr', 'ar'],
  branding: { primaryColor: '#14532d' },
  whatsappNumbers: ['+212600000026'],
  config: { contacts: { districts: ['Agdal', 'Hay Riad', 'Hassan', 'Souissi', 'Océan'] } },
  content: { fr: { tagline: 'Agence' }, ar: { tagline: 'وكالة' } },
};

const tenantB = {
  ...tenantA,
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  slug: 'autre',
  name: 'Autre',
  domains: ['autre.localhost'],
  whatsappNumbers: ['+212699999999'],
};

describe('leads, WhatsApp et isolation des biens', () => {
  let app: INestApplication;
  const notifyAgency = jest.fn(async () => ({ channel: 'wa.me' as const, url: 'https://wa.me/212600000026?text=lead' }));
  const properties = [
    {
      id: 'p-a',
      tenantId: tenantA.id,
      reference: 'ELH-AGD-01',
      title: 'Agdal',
      titleAr: '',
      description: null,
      descriptionAr: null,
      status: 'PUBLISHED',
      priceMad: 1000000,
      neighborhood: 'Agdal',
      transaction: 'BUY',
      bedrooms: 2,
      bathrooms: 1,
      surfaceM2: 80,
      featured: true,
      latitude: 1,
      longitude: 2,
      photos: [],
    },
    {
      id: 'p-b',
      tenantId: tenantB.id,
      reference: 'AUT-1',
      title: 'Autre',
      titleAr: '',
      status: 'PUBLISHED',
      priceMad: 500,
      neighborhood: 'Centre',
      transaction: 'RENT',
      photos: [],
    },
  ];
  const leads: Array<Record<string, unknown>> = [];

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('demo-password', 4);
    const users = [
      {
        id: 'user-a',
        email: 'admin@elhilal.example',
        name: 'Admin Elhilal',
        role: 'AGENCY_ADMIN' as const,
        tenantId: tenantA.id,
        passwordHash,
      },
    ];
    const tenants = [tenantA, tenantB];
    const prisma = {
      user: {
        findUnique: jest.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          return users.find((user) => user.email === where.email || user.id === where.id) ?? null;
        }),
      },
      tenant: {
        findMany: jest.fn(async () => tenants),
        findUnique: jest.fn(async ({ where }: { where: { id?: string } }) => {
          return tenants.find((tenant) => tenant.id === where.id) ?? null;
        }),
      },
      forTenant: jest.fn(async (tenantId: string, fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          property: {
            findMany: async ({ where }: { where: Record<string, unknown> }) =>
              properties.filter((row) => row.tenantId === tenantId && matchProperty(row, where)),
            findFirst: async ({ where }: { where: Record<string, unknown> }) =>
              properties.find((row) => row.tenantId === tenantId && matchProperty(row, where)) ?? null,
          },
          lead: {
            findMany: async ({ where }: { where: { tenantId: string } }) =>
              leads.filter((row) => row.tenantId === where.tenantId),
            create: async ({ data }: { data: Record<string, unknown> }) => {
              const row = { id: `lead-${leads.length + 1}`, createdAt: new Date().toISOString(), ...data };
              leads.push(row);
              return row;
            },
          },
        };
        return fn(tx);
      }),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(WhatsappService)
      .useValue({ notifyAgency })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('crée un lead site et notifie WhatsApp', async () => {
    const res = await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', '203.0.113.10')
      .send({
        host: 'elhilal.localhost',
        name: 'Sara',
        phone: '06 11 22 33 44',
        intent: 'BUY',
        budget: '450000',
        neighborhood: 'Agdal',
        timeline: 'urgent',
        propertyReference: 'ELH-AGD-01',
      })
      .expect(201);
    expect(res.body.ok).toBe(true);
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      source: 'SITE',
      status: 'NEW',
      tenantId: tenantA.id,
      phone: '0611223344',
      budgetLabel: '450000 MAD',
      propertyId: 'p-a',
    });
    expect(notifyAgency).toHaveBeenCalledWith(
      '+212600000026',
      '🔔 Nouveau lead : achat — Agdal — 450000 MAD — urgent | Nom : Sara — Tél : 0611223344',
    );
  });

  it('ignore le honeypot et refuse un téléphone invalide', async () => {
    const before = leads.length;
    const calls = notifyAgency.mock.calls.length;
    await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', '203.0.113.11')
      .send({
        host: 'elhilal.localhost',
        name: 'Bot',
        phone: '0611000000',
        intent: 'RENT',
        budget: '3000',
        neighborhood: 'Hassan',
        timeline: 'simple info',
        website: 'http://spam.test',
      })
      .expect(201);
    expect(leads).toHaveLength(before);
    expect(notifyAgency.mock.calls).toHaveLength(calls);
    await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', '203.0.113.12')
      .send({
        host: 'elhilal.localhost',
        name: 'Omar',
        phone: '0522000000',
        intent: 'BUY',
        budget: '100000',
        neighborhood: 'Agdal',
        timeline: 'urgent',
      })
      .expect(400);
  });

  it('limite le débit du formulaire', async () => {
    const body = {
      host: 'elhilal.localhost',
      name: 'Nora',
      phone: '0677000000',
      intent: 'RENT',
      budget: '4000',
      neighborhood: 'Hassan',
      timeline: 'ce mois-ci',
    };
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer()).post('/public/leads').set('x-forwarded-for', '203.0.113.40').send(body).expect(201);
    }
    await request(app.getHttpServer()).post('/public/leads').set('x-forwarded-for', '203.0.113.40').send(body).expect(429);
  });

  it('un admin Elhilal ne voit pas les biens ni les leads de l\'autre agence', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@elhilal.example', password: 'demo-password' })
      .expect(201);
    const token = login.body.accessToken as string;
    const own = await request(app.getHttpServer()).get('/properties').set('Authorization', `Bearer ${token}`).expect(200);
    expect(own.body.map((row: { reference: string }) => row.reference)).toEqual(['ELH-AGD-01']);
    await request(app.getHttpServer())
      .get('/properties')
      .query({ tenantId: tenantB.id })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    const publicList = await request(app.getHttpServer())
      .get('/public/properties')
      .query({ host: 'autre.localhost' })
      .expect(200);
    expect(publicList.body.map((row: { reference: string }) => row.reference)).toEqual(['AUT-1']);
    const leadList = await request(app.getHttpServer()).get('/leads').set('Authorization', `Bearer ${token}`).expect(200);
    expect(leadList.body.every((row: { tenantId: string }) => row.tenantId === tenantA.id)).toBe(true);
    expect(leadList.body.some((row: { tenantId: string }) => row.tenantId === tenantB.id)).toBe(false);
  });

  it('termine un chat darija et un chat français en notifiant WhatsApp', async () => {
    const darija = await request(app.getHttpServer())
      .post('/public/chat/start')
      .set('x-forwarded-for', '203.0.113.50')
      .send({ host: 'elhilal.localhost' })
      .expect(201);
    expect(darija.body.locale).toBe('ar');
    expect(darija.body.messages.join(' ')).toMatch(/السلام/);
    let sessionId = darija.body.sessionId as string;
    const steps = [
      { text: 'شرا' },
      { value: '<300k' },
      { value: 'Agdal' },
      { value: 'urgent' },
      { text: 'يوسف' },
      { text: '0612345678' },
    ];
    let doneBody: { done?: boolean } = {};
    for (const step of steps) {
      const stepResponse = await request(app.getHttpServer())
        .post('/public/chat/message')
        .set('x-forwarded-for', '203.0.113.50')
        .send({ sessionId, ...step })
        .expect(200);
      doneBody = stepResponse.body;
    }
    expect(doneBody.done).toBe(true);
    const chatbotLead = leads.find((row) => row.source === 'CHATBOT' && row.name === 'يوسف');
    expect(chatbotLead).toMatchObject({ status: 'NEW', tenantId: tenantA.id, phone: '0612345678', timeline: 'urgent' });
    expect(notifyAgency).toHaveBeenCalledWith(
      '+212600000026',
      '🔔 Nouveau lead : achat — Agdal — <300k — urgent | Nom : يوسف — Tél : 0612345678',
    );

    const french = await request(app.getHttpServer())
      .post('/public/chat/start')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ host: 'elhilal.localhost' })
      .expect(201);
    sessionId = french.body.sessionId;
    const fr = await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, text: 'Bonjour, location' })
      .expect(200);
    expect(fr.body.locale).toBe('fr');
    await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, value: '3-6k' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, value: 'Hassan' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, value: 'ce mois-ci' })
      .expect(200);
    await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, text: 'Sara' })
      .expect(200);
    const done = await request(app.getHttpServer())
      .post('/public/chat/message')
      .set('x-forwarded-for', '203.0.113.51')
      .send({ sessionId, text: '0700112233' })
      .expect(200);
    expect(done.body.done).toBe(true);
    expect(done.body.messages.join(' ')).toMatch(/Merci/);
    expect(notifyAgency).toHaveBeenCalledWith(
      '+212600000026',
      '🔔 Nouveau lead : location — Hassan — 3-6k — ce mois-ci | Nom : Sara — Tél : 0700112233',
    );
  });
});

function matchProperty(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  if (where.tenantId && row.tenantId !== where.tenantId) return false;
  if (where.id && row.id !== where.id) return false;
  if (where.reference && row.reference !== where.reference) return false;
  if (where.status && row.status !== where.status) return false;
  return true;
}
