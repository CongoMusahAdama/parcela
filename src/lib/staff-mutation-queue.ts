import { ApiError } from "@/lib/api-client";
import { isBrowserOffline, isRetriableNetworkError } from "@/lib/network";
import {
  confirmBusArrivalApi,
  markParcelPaidApi,
  releaseParcelApi,
  verifyAndLogParcelApi,
} from "@/lib/staff-api";

const QUEUE_KEY = "parcela_staff_mutation_queue_v1";
const MAX_RETRIES = 8;

export type StaffQueuedMutation =
  | {
      id: string;
      type: "verify-log";
      createdAt: string;
      retries: number;
      lastError?: string;
      reference: string;
      body: {
        busNumber: string;
        driverPhone: string;
        driverName?: string;
        paymentWho?: "sender" | "receiver";
        markPaid?: boolean;
      };
      label: string;
    }
  | {
      id: string;
      type: "confirm-arrival";
      createdAt: string;
      retries: number;
      lastError?: string;
      busNumber: string;
      label: string;
    }
  | {
      id: string;
      type: "release";
      createdAt: string;
      retries: number;
      lastError?: string;
      reference: string;
      pickupCode: string;
      label: string;
    }
  | {
      id: string;
      type: "mark-paid";
      createdAt: string;
      retries: number;
      lastError?: string;
      reference: string;
      body: { paymentWho?: "sender" | "receiver"; markPaid?: boolean };
      label: string;
    };

export type StaffMutationRunResult<T> =
  | { status: "synced"; data: T }
  | { status: "queued"; item: StaffQueuedMutation };

type QueueListener = (items: StaffQueuedMutation[]) => void;

const listeners = new Set<QueueListener>();
let flushing = false;

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readQueue(): StaffQueuedMutation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StaffQueuedMutation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: StaffQueuedMutation[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener(items));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getStaffMutationQueue(): StaffQueuedMutation[] {
  return readQueue();
}

export function clearStaffMutationQueue() {
  writeQueue([]);
}

export function subscribeStaffMutationQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener(readQueue());
  return () => {
    listeners.delete(listener);
  };
}

function enqueue(
  item: Omit<StaffQueuedMutation, "id" | "createdAt" | "retries"> & { lastError?: string },
): StaffQueuedMutation {
  const next = {
    ...item,
    id: createId(),
    createdAt: new Date().toISOString(),
    retries: 0,
  } as StaffQueuedMutation;
  writeQueue([...readQueue(), next]);
  return next;
}

async function runMutation(item: StaffQueuedMutation) {
  switch (item.type) {
    case "verify-log":
      return verifyAndLogParcelApi(item.reference, item.body);
    case "confirm-arrival":
      return confirmBusArrivalApi(item.busNumber);
    case "release":
      return releaseParcelApi(item.reference, item.pickupCode);
    case "mark-paid":
      return markParcelPaidApi(item.reference, item.body);
    default: {
      const _exhaustive: never = item;
      return _exhaustive;
    }
  }
}

/**
 * Runs a staff mutation immediately when online; otherwise queues it for later flush.
 * Also queues on retriable network errors after a live attempt fails.
 */
export async function runOrQueueStaffMutation<T>(options: {
  execute: () => Promise<T>;
  queueWhenOffline: () => Omit<StaffQueuedMutation, "id" | "createdAt" | "retries">;
}): Promise<StaffMutationRunResult<T>> {
  if (isBrowserOffline()) {
    const item = enqueue(options.queueWhenOffline());
    return { status: "queued", item };
  }

  try {
    const data = await options.execute();
    return { status: "synced", data };
  } catch (error) {
    if (!isRetriableNetworkError(error)) throw error;
    const draft = options.queueWhenOffline();
    const item = enqueue({
      ...draft,
      lastError: error instanceof Error ? error.message : "Network error",
    });
    return { status: "queued", item };
  }
}

export type StaffQueueFlushResult = {
  synced: number;
  remaining: number;
  failed: number;
};

/** Flush queued counter actions when connectivity returns. */
export async function flushStaffMutationQueue(): Promise<StaffQueueFlushResult> {
  if (flushing) {
    return { synced: 0, remaining: readQueue().length, failed: 0 };
  }
  if (isBrowserOffline()) {
    return { synced: 0, remaining: readQueue().length, failed: 0 };
  }

  flushing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = readQueue();
    const remaining: StaffQueuedMutation[] = [];

    for (const item of pending) {
      try {
        await runMutation(item);
        synced += 1;
      } catch (error) {
        if (isRetriableNetworkError(error) && item.retries + 1 < MAX_RETRIES) {
          remaining.push({
            ...item,
            retries: item.retries + 1,
            lastError: error instanceof Error ? error.message : "Network error",
          });
        } else if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          // Drop non-retriable client errors (stale pickup code, already processed, etc.)
          failed += 1;
        } else if (item.retries + 1 < MAX_RETRIES) {
          remaining.push({
            ...item,
            retries: item.retries + 1,
            lastError: error instanceof Error ? error.message : "Sync failed",
          });
        } else {
          failed += 1;
        }
      }
    }

    writeQueue(remaining);
    return { synced, remaining: remaining.length, failed };
  } finally {
    flushing = false;
  }
}
