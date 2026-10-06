import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import {
  leadFromAnswers,
  loadDefaultFlow,
  mergeFlow,
  nudgeChat,
  sendChat,
  startChat,
  withNeighborhoods,
  type ChatState,
  type Flow,
} from '@nizios/chatbot-flows';
import { findClientsDir } from '@nizios/db';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { RateLimiter } from '../common/rate-limit';
import { LeadsService } from '../leads/leads.service';
import { TenantsService } from '../tenants/tenants.service';
import type { WhatsappDelivery } from '../whatsapp/whatsapp.service';

type Session = {
  id: string;
  tenantId: string;
  agency: string;
  agencyPhone: string | null;
  flow: Flow;
  state: ChatState;
  leadId?: string;
  creating?: boolean;
};

type TurnPayload = {
  sessionId: string;
  messages: string[];
  quickReplies: { value: string; label: string }[];
  done: boolean;
  locale: 'ar' | 'fr';
  whatsapp: WhatsappDelivery | null;
};

/**
 * Sessions en mémoire. Un interpréteur Gemini pourra être passé à sendChat
 * plus tard, sans changer le JSON du flow.
 */
@Injectable()
export class ChatbotService {
  private readonly sessions = new Map<string, Session>();
  private readonly starts = new RateLimiter(30, 10 * 60 * 1000);

  constructor(
    private readonly tenants: TenantsService,
    private readonly leads: LeadsService,
  ) {}

  async start(host: string, ip: string): Promise<TurnPayload> {
    if (!this.starts.allow(`start:${ip}`)) {
      throw new HttpException('Trop de conversations. Réessayez dans quelques minutes.', 429);
    }
    const tenant = await this.tenants.findByHost(host);
    const flow = this.flowFor(tenant.slug, this.districts(tenant.config));
    const turn = startChat(flow, { agency: tenant.name, now: Date.now() });
    const session: Session = {
      id: randomUUID(),
      tenantId: tenant.id,
      agency: tenant.name,
      agencyPhone: tenant.whatsappNumbers[0] ?? null,
      flow,
      state: turn.state,
    };
    this.sessions.set(session.id, session);
    return this.payload(session, turn.messages, turn.quickReplies, turn.done, null);
  }

  async message(sessionId: string, input: { text?: string; value?: string }, ip: string): Promise<TurnPayload> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('Conversation introuvable.');
    const turn = sendChat(session.flow, session.state, input, { agency: session.agency, now: Date.now() });
    session.state = turn.state;
    const whatsapp = await this.finish(session, ip);
    return this.payload(session, turn.messages, turn.quickReplies, turn.done, whatsapp);
  }

  async nudge(sessionId: string): Promise<TurnPayload | { error: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException('Conversation introuvable.');
    const turn = nudgeChat(session.flow, session.state, Date.now());
    if ('error' in turn) return { error: turn.error };
    session.state = turn.state;
    return this.payload(session, turn.messages, turn.quickReplies, false, null);
  }

  private async finish(session: Session, ip: string): Promise<WhatsappDelivery | null> {
    if (!session.state.done || session.leadId || session.creating) return null;
    const answers = leadFromAnswers(session.state.answers);
    if (!answers) return null;
    session.creating = true;
    try {
      const saved = await this.leads.createFromChat(
        {
          tenantId: session.tenantId,
          source: 'CHATBOT',
          name: answers.name,
          phone: answers.phone,
          intent: answers.intent,
          budgetLabel: answers.budgetLabel,
          budgetMad: null,
          neighborhood: answers.neighborhood,
          timeline: answers.timeline,
          notes: 'Chatbot',
        },
        session.agencyPhone,
        ip,
      );
      session.leadId = saved.lead.id;
      return saved.delivery;
    } catch (error) {
      session.creating = false;
      throw error;
    }
  }

  private payload(
    session: Session,
    messages: string[],
    quickReplies: { value: string; label: string }[],
    done: boolean,
    whatsapp: WhatsappDelivery | null,
  ): TurnPayload {
    return { sessionId: session.id, messages, quickReplies, done, locale: session.state.locale, whatsapp };
  }

  private districts(config: unknown): string[] {
    if (!config || typeof config !== 'object') return [];
    const contacts = (config as { contacts?: { districts?: unknown } }).contacts;
    if (!contacts || !Array.isArray(contacts.districts)) return [];
    return contacts.districts.filter((item): item is string => typeof item === 'string');
  }

  private flowFor(slug: string, districts: string[]): Flow {
    const file = path.join(findClientsDir(), slug, 'chatbot', 'flow.json');
    const override = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Flow>) : null;
    let flow = mergeFlow(loadDefaultFlow(), override);
    const customNeighborhoods = Boolean(override?.steps && Object.prototype.hasOwnProperty.call(override.steps, 'neighborhood'));
    if (!customNeighborhoods) flow = withNeighborhoods(flow, districts);
    return flow;
  }
}
