import { Injectable } from '@nestjs/common';
import { TransportOperator } from '../schemas/transport-operator.schema';

export type PlatformOperatorApiRow = {
  id: string;
  code: string;
  name: string;
  status: 'configure' | 'configured' | 'suspended' | 'draft';
  brandColor: string;
  logoDataUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  region: string;
  cityCount: number;
  stationCount: number;
  hqAdminCount: number;
  hqConfigured: boolean;
  primaryAdminEmail: string | null;
  primaryAdminName: string | null;
  notes: string;
  updatedAt: string;
  subscriptionPlan: 'annual' | 'trial' | null;
  subscriptionPaidAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionAmountGhs: number | null;
  renewalRemindersSent: Array<'30d' | '14d' | '7d' | '1d'>;
  agreementDate: string | null;
  configurationLetterGeneratedAt: string | null;
};

export function toOperatorApiRow(
  doc: TransportOperator & { operatorId: string; updatedAt?: Date },
  hqAdminCount = 0,
): PlatformOperatorApiRow {
  return {
    id: doc.operatorId,
    code: doc.code,
    name: doc.name,
    status: doc.status,
    brandColor: doc.brandColor,
    logoDataUrl: doc.logoDataUrl ?? null,
    contactEmail: doc.contactEmail ?? null,
    contactPhone: doc.contactPhone ?? null,
    region: doc.region,
    cityCount: doc.cityCount,
    stationCount: doc.stationCount,
    hqAdminCount,
    hqConfigured: doc.hqConfigured,
    primaryAdminEmail: doc.primaryAdminEmail ?? null,
    primaryAdminName: doc.primaryAdminName ?? null,
    notes: doc.notes,
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : new Date().toISOString(),
    subscriptionPlan: doc.subscriptionPlan ?? null,
    subscriptionPaidAt: doc.subscriptionPaidAt
      ? new Date(doc.subscriptionPaidAt).toISOString()
      : null,
    subscriptionExpiresAt: doc.subscriptionExpiresAt
      ? new Date(doc.subscriptionExpiresAt).toISOString()
      : null,
    subscriptionAmountGhs: doc.subscriptionAmountGhs ?? null,
    renewalRemindersSent: doc.renewalRemindersSent ?? [],
    agreementDate: doc.agreementDate ?? null,
    configurationLetterGeneratedAt: doc.configurationLetterGeneratedAt
      ? new Date(doc.configurationLetterGeneratedAt).toISOString()
      : null,
  };
}
