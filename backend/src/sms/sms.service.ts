import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { normalizeGhanaPhone } from '../common/utils/phone.util';

type MnotifyQuickSmsResponse = {
  status?: string;
  code?: string;
  message?: string;
  summary?: { _id?: string; message_id?: string };
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  private get enabled() {
    return this.config.get<boolean>('mnotify.enabled') === true;
  }

  private get apiKey() {
    return this.config.get<string>('mnotify.apiKey') ?? '';
  }

  private get senderId() {
    return this.config.get<string>('mnotify.senderId') ?? 'Parcela';
  }

  private get baseUrl() {
    return this.config.get<string>('mnotify.baseUrl') ?? 'https://api.mnotify.com/api';
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    const recipient = normalizeGhanaPhone(to);

    if (!this.enabled) {
      this.logger.log(`[SMS disabled] To ${recipient}: ${message}`);
      return true;
    }

    if (!this.apiKey) {
      this.logger.warn('MNOTIFY_API_KEY missing — SMS not sent');
      return false;
    }

    try {
      const url = `${this.baseUrl}/sms/quick?key=${encodeURIComponent(this.apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: [recipient],
          sender: this.senderId,
          message,
          is_schedule: false,
          schedule_date: '',
        }),
      });

      const data = (await response.json()) as MnotifyQuickSmsResponse;
      if (!response.ok || data.status === 'error') {
        this.logger.error(`mNotify error: ${JSON.stringify(data)}`);
        return false;
      }

      this.logger.log(`SMS sent to ${recipient}`);
      return true;
    } catch (error) {
      this.logger.error(`mNotify request failed: ${String(error)}`);
      return false;
    }
  }

  async sendBookingConfirmation(params: {
    senderPhone: string;
    senderName: string;
    bookingReference: string;
    pickupCode: string;
    originStationName: string;
    trackingUrl: string;
  }) {
    const message = `Hi ${params.senderName}, your Parcela booking ${params.bookingReference} is confirmed. Drop off at ${params.originStationName}. Tracking ID: ${params.pickupCode}. Track: ${params.trackingUrl}`;
    return this.sendSms(params.senderPhone, message);
  }

  async sendArrivalNotification(params: {
    recipientPhone: string;
    recipientName: string;
    pickupCode: string;
    stationName: string;
    trackingUrl: string;
  }) {
    const message = `Hi ${params.recipientName}, your parcel is ready at ${params.stationName}. Pickup code: ${params.pickupCode}. Track: ${params.trackingUrl}`;
    return this.sendSms(params.recipientPhone, message);
  }
}
