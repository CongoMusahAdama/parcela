export type SubscriptionPlan = 'annual' | 'trial';

export const ANNUAL_LICENCE_DURATIONS = [
  { value: '12', label: '12 months (1 year)' },
  { value: '6', label: '6 months' },
  { value: '3', label: '3 months' },
  { value: '1', label: '1 month' },
] as const;

export const TRIAL_LICENCE_DURATIONS = [
  { value: '30', label: '30 days' },
  { value: '14', label: '14 days' },
  { value: '7', label: '7 days' },
] as const;

export function licenceDurationOptions(plan: SubscriptionPlan) {
  return plan === 'trial' ? TRIAL_LICENCE_DURATIONS : ANNUAL_LICENCE_DURATIONS;
}

export function defaultLicenceDuration(plan: SubscriptionPlan) {
  return plan === 'trial' ? '30' : '12';
}

export function computeSubscriptionExpiresAt(
  paidAt: string,
  plan: SubscriptionPlan,
  duration: string,
): string | null {
  const trimmed = paidAt.trim();
  if (!trimmed) return null;

  const start = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const amount = Number.parseInt(duration, 10);
  if (!Number.isFinite(amount) || amount < 1) return null;

  const end = new Date(start);
  if (plan === 'trial') {
    end.setDate(end.getDate() + amount);
  } else {
    end.setMonth(end.getMonth() + amount);
  }
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

export function formatLicenceExpiryLabel(expiresAt: string | null) {
  if (!expiresAt) return '—';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
