import { Injectable, Logger } from '@nestjs/common';
import { toWhatsappDigits, waMeUrl } from '@nizios/chatbot-flows';

export type WhatsappDelivery = {
  channel: 'cloud' | 'wa.me';
  url: string | null;
};

/**
 * Notification vers le WhatsApp de l'agence.
 * Si WHATSAPP_CLOUD_TOKEN et WHATSAPP_CLOUD_PHONE_NUMBER_ID sont vides,
 * on ne contacte pas Meta : on renvoie le lien wa.me (fallback local).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async notifyAgency(agencyPhone: string, message: string): Promise<WhatsappDelivery> {
    const url = waMeUrl(agencyPhone, message);
    const token = process.env.WHATSAPP_CLOUD_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();
    const digits = toWhatsappDigits(agencyPhone);
    if (!token || !phoneNumberId || !digits) {
      return { channel: 'wa.me', url };
    }
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: digits,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      });
      if (!response.ok) {
        this.logger.warn(`WhatsApp Cloud a répondu ${response.status}, repli wa.me.`);
        return { channel: 'wa.me', url };
      }
      return { channel: 'cloud', url };
    } catch (error) {
      this.logger.warn(`WhatsApp Cloud injoignable, repli wa.me. ${String(error)}`);
      return { channel: 'wa.me', url };
    }
  }
}
