/** Ghana local numbers → 233XXXXXXXXX for mNotify */
export function normalizeGhanaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `${digits.slice(0, 3)} *** ${digits.slice(-4)}`;
}

/** True when a phone can receive operational SMS (not blank / placeholder). */
export function isProvisionedPhone(phone: string | undefined | null): phone is string {
  if (!phone?.trim()) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return false;
  if (/^0+$/.test(digits)) return false;
  if (digits === '200000000' || digits === '0200000000') return false;
  return true;
}
