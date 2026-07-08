import type { Operator } from "@/types/parcel";
import {
  fetchOperatorControls,
  fetchOperatorLockStatus,
  patchOperatorLocksApi,
  patchOperatorSettingsApi,
  type OperatorControlAuditEntry,
  type OperatorControlLocks,
  type OperatorControlSettings,
  type OperatorControlsPayload,
} from "@/lib/admin-api";

export type {
  OperatorControlAuditEntry,
  OperatorControlLocks,
  OperatorControlSettings,
  OperatorControlsPayload,
};

const DEFAULT_LOCKS: OperatorControlLocks = {
  bookingsLocked: false,
  staffOpsLocked: false,
  leadOpsLocked: false,
};

/** In-memory cache so staff/lead banners can read sync helpers after a poll. */
const lockCache = new Map<Operator, OperatorControlLocks>();

export function countActiveLocks(locks: OperatorControlLocks) {
  return [locks.bookingsLocked, locks.staffOpsLocked, locks.leadOpsLocked].filter(Boolean)
    .length;
}

export function cacheOperatorLocks(operator: Operator, locks: OperatorControlLocks) {
  lockCache.set(operator, { ...locks });
}

export function getCachedOperatorLocks(operator: Operator): OperatorControlLocks {
  return { ...(lockCache.get(operator) ?? DEFAULT_LOCKS) };
}

export async function loadOperatorControls(): Promise<OperatorControlsPayload> {
  const payload = await fetchOperatorControls();
  cacheOperatorLocks(payload.operator, {
    bookingsLocked: payload.bookingsLocked,
    staffOpsLocked: payload.staffOpsLocked,
    leadOpsLocked: payload.leadOpsLocked,
  });
  return payload;
}

export async function loadOperatorLockStatus(operator: Operator): Promise<OperatorControlLocks> {
  const status = await fetchOperatorLockStatus(operator);
  const locks: OperatorControlLocks = {
    bookingsLocked: status.bookingsLocked,
    staffOpsLocked: status.staffOpsLocked,
    leadOpsLocked: status.leadOpsLocked,
  };
  cacheOperatorLocks(operator, locks);
  return locks;
}

export async function setOperatorLock(
  _operator: Operator,
  key: keyof OperatorControlLocks,
  value: boolean,
  _actor: string,
): Promise<OperatorControlLocks> {
  const payload = await patchOperatorLocksApi({ [key]: value });
  const locks: OperatorControlLocks = {
    bookingsLocked: payload.bookingsLocked,
    staffOpsLocked: payload.staffOpsLocked,
    leadOpsLocked: payload.leadOpsLocked,
  };
  cacheOperatorLocks(payload.operator, locks);
  return locks;
}

export async function saveOperatorSettings(
  _operator: Operator,
  settings: OperatorControlSettings,
  _actor: string,
): Promise<OperatorControlsPayload> {
  const payload = await patchOperatorSettingsApi(settings);
  cacheOperatorLocks(payload.operator, {
    bookingsLocked: payload.bookingsLocked,
    staffOpsLocked: payload.staffOpsLocked,
    leadOpsLocked: payload.leadOpsLocked,
  });
  return payload;
}

/** Sync read of last polled locks (prefer loadOperatorLockStatus for freshness). */
export function isStaffOpsFrozen(operator: Operator): boolean {
  return getCachedOperatorLocks(operator).staffOpsLocked;
}

export function isLeadOpsFrozen(operator: Operator): boolean {
  return getCachedOperatorLocks(operator).leadOpsLocked;
}

export function isBookingsFrozen(operator: Operator): boolean {
  return getCachedOperatorLocks(operator).bookingsLocked;
}

export function getStaffFreezeMessage(operator: Operator): string {
  return `${operator} HQ has frozen staff operations. You can still view parcels, but verify, arrive, and release are paused until HQ unlocks.`;
}

export function getLeadFreezeMessage(operator: Operator): string {
  return `${operator} HQ has frozen lead operations. You can still view your branch, but adding or editing staff is paused until HQ unlocks.`;
}
