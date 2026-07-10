import { BadRequestException } from '@nestjs/common';

export type SubscriptionPlan = 'annual' | 'trial';

const ANNUAL_DURATIONS = new Set(['1', '3', '6', '12']);
const TRIAL_DURATIONS = new Set(['7', '14', '30']);

export function resolveSubscriptionTerm(
  plan: SubscriptionPlan,
  duration: string,
  paidAtInput: string | undefined,
  agreementDate: string,
) {
  const paidOn = (paidAtInput?.trim() || agreementDate.trim()).slice(0, 10);
  if (!paidOn) {
    throw new BadRequestException('Licence paid date or agreement date is required.');
  }

  const durationValue = duration.trim();
  const allowed = plan === 'trial' ? TRIAL_DURATIONS : ANNUAL_DURATIONS;
  if (!allowed.has(durationValue)) {
    throw new BadRequestException('Invalid licence duration for the selected plan.');
  }

  const paidAt = new Date(`${paidOn}T00:00:00`);
  if (Number.isNaN(paidAt.getTime())) {
    throw new BadRequestException('Licence paid date is invalid.');
  }

  const amount = Number.parseInt(durationValue, 10);
  const expiresAt = new Date(paidAt);
  if (plan === 'trial') {
    expiresAt.setDate(expiresAt.getDate() + amount);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + amount);
  }
  expiresAt.setHours(23, 59, 59, 999);

  return {
    subscriptionPlan: plan,
    subscriptionPaidAt: paidAt,
    subscriptionExpiresAt: expiresAt,
  };
}
