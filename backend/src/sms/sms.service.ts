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
    const message = [
      `We've got it.`,
      `Hi ${params.senderName}, your Parcela booking ${params.bookingReference} is confirmed.`,
      `Drop off at ${params.originStationName}.`,
      `Pickup code: ${params.pickupCode}.`,
      `Track: ${params.trackingUrl}`,
    ].join(' ');
    return this.sendSms(params.senderPhone, message);
  }

  async sendInTransitNotification(params: {
    recipientPhone: string;
    recipientName: string;
    originStationName: string;
    destinationStationName: string;
    pickupCode: string;
    trackingUrl: string;
    paymentStatus?: 'paid' | 'unpaid';
    paymentWho?: 'sender' | 'receiver';
  }) {
    const paymentLine =
      params.paymentStatus === 'paid'
        ? 'Fee already paid — nothing to pay at collection.'
        : params.paymentWho === 'receiver'
          ? 'Payment will be due at collection.'
          : params.paymentStatus === 'unpaid'
            ? 'Payment status: unpaid — check before you collect.'
            : null;
    const message = [
      `It's on the way.`,
      `Hi ${params.recipientName}, your parcel has left ${params.originStationName} and is heading to ${params.destinationStationName}.`,
      paymentLine,
      `Pickup code: ${params.pickupCode}.`,
      `Track: ${params.trackingUrl}`,
    ]
      .filter(Boolean)
      .join(' ');
    return this.sendSms(params.recipientPhone, message);
  }

  /** Sender paid at origin — tell the recipient they won’t need to pay at collection. */
  async sendPaymentPaidNotification(params: {
    recipientPhone: string;
    recipientName: string;
    pickupCode: string;
    stationName: string;
    trackingUrl: string;
  }) {
    const message = [
      `Fee paid.`,
      `Hi ${params.recipientName}, the sender has paid for your parcel (${params.pickupCode}).`,
      `No payment needed when you collect at ${params.stationName}.`,
      `Track: ${params.trackingUrl}`,
    ].join(' ');
    return this.sendSms(params.recipientPhone, message);
  }

  async sendArrivalNotification(params: {
    recipientPhone: string;
    recipientName: string;
    pickupCode: string;
    stationName: string;
    trackingUrl: string;
    paymentStatus?: 'paid' | 'unpaid';
    paymentWho?: 'sender' | 'receiver';
  }) {
    const paid = params.paymentStatus === 'paid';
    const paymentLine = paid
      ? 'Fee already paid — nothing to pay at the counter.'
      : 'Payment not received yet — please pay at the counter before collection.';
    const message = [
      `Ready for you.`,
      `Hi ${params.recipientName}, your parcel is ready at ${params.stationName}.`,
      paymentLine,
      `Pickup code: ${params.pickupCode}.`,
      `Track: ${params.trackingUrl}`,
    ].join(' ');
    return this.sendSms(params.recipientPhone, message);
  }

  private portalUrl(path: string) {
    const base = (this.config.get<string>('app.publicWebUrl') ?? 'http://localhost:3001').replace(
      /\/$/,
      '',
    );
    return `${base}${path}`;
  }

  async sendHqAdminCredentials(params: {
    phone: string;
    displayName: string;
    email: string;
    temporaryPassword: string;
    operatorName: string;
    reason: 'new' | 'issued' | 'reset';
  }) {
    const loginUrl = this.portalUrl('/admin/login');
    const intro =
      params.reason === 'reset'
        ? `Parcela HQ password reset for ${params.operatorName}.`
        : params.reason === 'new'
          ? `Welcome to Parcela — HQ access for ${params.operatorName} is ready.`
          : `Parcela HQ login for ${params.operatorName} is ready.`;
    const message = [
      intro,
      `Sign in: ${loginUrl}`,
      `Phone: ${params.phone}`,
      `Temporary code: ${params.temporaryPassword}`,
      'Sign in with this code, then set a new password from the portal.',
      'Do not share this code with anyone.',
    ].join(' ');
    return this.sendSms(params.phone, message);
  }

  async sendBranchLeadCredentials(params: {
    phone: string;
    displayName: string;
    temporaryPin: string;
    stationName: string;
    reason: 'new' | 'reset';
  }) {
    const loginUrl = this.portalUrl('/portal/login');
    const intro =
      params.reason === 'reset'
        ? `Parcela branch lead login reset for ${params.stationName}.`
        : `Parcela branch lead access for ${params.stationName} is ready.`;
    const message = [
      intro,
      `Sign in: ${loginUrl}`,
      `Phone: ${params.phone}`,
      `Temporary PIN: ${params.temporaryPin}`,
      'Sign in with this PIN, then set a new password from the portal.',
    ].join(' ');
    return this.sendSms(params.phone, message);
  }

  async sendCounterStaffCredentials(params: {
    phone: string;
    displayName: string;
    email: string;
    temporaryPassword: string;
    stationName: string;
    reason: 'new' | 'reset';
  }) {
    const loginUrl = this.portalUrl('/portal/login');
    const intro =
      params.reason === 'reset'
        ? `Parcela counter staff login reset for ${params.stationName}.`
        : `Parcela counter staff account for ${params.stationName} is ready.`;
    const message = [
      intro,
      `Sign in: ${loginUrl}`,
      `Phone: ${params.phone}`,
      `Temporary code: ${params.temporaryPassword}`,
      'Sign in with this code, then set a new password from the portal.',
    ].join(' ');
    return this.sendSms(params.phone, message);
  }

  async sendRenewalReminderNotice(params: {
    phone: string;
    operatorName: string;
    reminderLabel: string;
    expiresAt?: string | null;
  }) {
    const expiry = params.expiresAt ? ` Renewal due ${params.expiresAt}.` : '';
    const message = `Parcela subscription reminder for ${params.operatorName}: ${params.reminderLabel} countdown.${expiry} Contact Parcela if you need help.`;
    return this.sendSms(params.phone, message);
  }

  async sendConfigurationLetterNotice(params: {
    phone: string;
    operatorName: string;
  }) {
    const message = `Parcela configuration for ${params.operatorName} is complete. Your configuration letter has been prepared — check your email or contact Parcela support.`;
    return this.sendSms(params.phone, message);
  }

  private formatLoginTimestamp(at: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Accra',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(at);
  }

  async sendSecureLoginAlert(params: {
    phone: string;
    displayName: string;
    role: 'platform' | 'hq' | 'lead' | 'staff';
    stationName?: string;
    operatorName?: string;
  }) {
    const portalLabels: Record<typeof params.role, string> = {
      platform: 'Platform control portal',
      hq: 'HQ admin portal',
      lead: 'Branch lead portal',
      staff: 'Counter staff portal',
    };
    const portal = portalLabels[params.role];
    const context = params.stationName
      ? ` at ${params.stationName}`
      : params.operatorName
        ? ` for ${params.operatorName}`
        : '';
    const when = this.formatLoginTimestamp(new Date());
    const message = [
      `Hi ${params.displayName},`,
      `You signed in to Parcela ${portal}${context} on ${when}.`,
      `If this wasn't you, contact Parcela support immediately.`,
    ].join(' ');
    return this.sendSms(params.phone, message);
  }
}
