/** UI-phase demo data for Parcela platform. Replace with API later. */

export type PlatformOperatorStatus = "configure" | "configured" | "suspended" | "draft";

export type PlatformSubscriptionPlan = "annual" | "trial";

export type PlatformRenewalReminder = "30d" | "14d" | "7d" | "1d";

export const SUBSCRIPTION_REMINDER_DAYS: Record<PlatformRenewalReminder, number> = {
  "30d": 30,
  "14d": 14,
  "7d": 7,
  "1d": 1,
};

export type PlatformSubscriptionStatus = "active" | "expiring" | "expired" | "unpaid";

export type PlatformOperatorRow = {
  id: string;
  /** Short code e.g. VIP, STC, OA, METRO */
  code: string;
  name: string;
  status: PlatformOperatorStatus;
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
  /** Annual Parcela platform licence — null until first payment */
  subscriptionPlan: PlatformSubscriptionPlan | null;
  subscriptionPaidAt: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionAmountGhs: number | null;
  /** Countdown emails already sent for the current billing period */
  renewalRemindersSent: PlatformRenewalReminder[];
  /** Date the pre-onboard platform agreement was signed (YYYY-MM-DD) */
  agreementDate: string | null;
  /** When the configuration completion letter was last generated/sent */
  configurationLetterGeneratedAt: string | null;
};

export type PlatformSubscriptionSnapshot = {
  status: PlatformSubscriptionStatus;
  daysRemaining: number | null;
  planLabel: string;
  expiresLabel: string;
  paidLabel: string;
  dueReminder: PlatformRenewalReminder | null;
  nextReminderLabel: string | null;
  progressPercent: number;
};

export type PlatformHqAdminRow = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  operatorCode: string;
  status: "active" | "pending_setup" | "inactive";
  lastSignInAt: string | null;
};

export type PlatformAuditRow = {
  id: string;
  action: string;
  detail: string;
  at: string;
};

export type PlatformAuditKind = "onboard" | "configure" | "credentials" | "access" | "other";

export function getPlatformAuditKind(action: string): PlatformAuditKind {
  const normalized = action.toLowerCase();
  if (normalized.includes("onboard")) return "onboard";
  if (normalized.includes("configured") || normalized.includes("configure")) return "configure";
  if (
    normalized.includes("credential") ||
    normalized.includes("admin created") ||
    normalized.includes("issued")
  ) {
    return "credentials";
  }
  if (normalized.includes("login reset") || normalized.includes("locked")) return "access";
  return "other";
}

export function platformAuditKindLabel(kind: PlatformAuditKind) {
  if (kind === "onboard") return "Onboarding";
  if (kind === "configure") return "Configuration";
  if (kind === "credentials") return "Credentials";
  if (kind === "access") return "Access";
  return "Other";
}

export function formatPlatformWhenRelative(iso: string | null) {
  if (!iso) return null;
  try {
    const at = new Date(iso).getTime();
    const diffMs = Date.now() - at;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return null;
  } catch {
    return null;
  }
}

/** Any portal login across transports — HQ, branch lead, or counter staff. */
export type PlatformUserRole = "hq_admin" | "branch_lead" | "counter_staff";

export type PlatformUserStatus = "active" | "locked" | "pending_setup" | "inactive";

export type PlatformUserRow = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: PlatformUserRole;
  operatorCode: string;
  operatorName: string;
  stationName: string | null;
  status: PlatformUserStatus;
  lastSignInAt: string | null;
};

export const PLATFORM_OPERATORS: PlatformOperatorRow[] = [
  {
    id: "op-vip",
    code: "VIP",
    name: "VIP Transport",
    status: "configure",
    brandColor: "#c8102e",
    logoDataUrl: null,
    contactEmail: "ops@viptransport.gh",
    contactPhone: "0302 000 111",
    region: "Nationwide",
    cityCount: 8,
    stationCount: 14,
    hqAdminCount: 2,
    hqConfigured: false,
    primaryAdminEmail: "hq.admin@parcela.app",
    primaryAdminName: "HQ Administrator",
    notes: "Awaiting HQ Admin setup completion before go-live.",
    updatedAt: "2026-07-08T18:20:00.000Z",
    subscriptionPlan: null,
    subscriptionPaidAt: null,
    subscriptionExpiresAt: null,
    subscriptionAmountGhs: null,
    renewalRemindersSent: [],
    agreementDate: "2025-06-15",
    configurationLetterGeneratedAt: null,
  },
  {
    id: "op-stc",
    code: "STC",
    name: "STC Transport",
    status: "configured",
    brandColor: "#0b6e4f",
    logoDataUrl: null,
    contactEmail: "hq@stc.gov.gh",
    contactPhone: "0302 000 222",
    region: "Nationwide",
    cityCount: 7,
    stationCount: 13,
    hqAdminCount: 1,
    hqConfigured: true,
    primaryAdminEmail: "hq.stc@parcela.app",
    primaryAdminName: "STC HQ Admin",
    notes: "Configured. HQ can create branch leads for each terminal.",
    updatedAt: "2026-07-08T16:05:00.000Z",
    subscriptionPlan: "annual",
    subscriptionPaidAt: "2025-07-24T10:00:00.000Z",
    subscriptionExpiresAt: "2026-07-24T23:59:59.000Z",
    subscriptionAmountGhs: 12000,
    renewalRemindersSent: ["30d"],
    agreementDate: "2025-07-01",
    configurationLetterGeneratedAt: "2026-07-08T16:05:00.000Z",
  },
];

export const PLATFORM_HQ_ADMINS: PlatformHqAdminRow[] = [
  {
    id: "hq-1",
    displayName: "HQ Administrator",
    email: "hq.admin@parcela.app",
    phone: "0200000001",
    operatorCode: "VIP",
    status: "pending_setup",
    lastSignInAt: "2026-07-08T10:12:00.000Z",
  },
  {
    id: "hq-2",
    displayName: "VIP HQ Admin",
    email: "hq.vip@parcela.app",
    phone: "0200000002",
    operatorCode: "VIP",
    status: "active",
    lastSignInAt: "2026-07-08T21:40:00.000Z",
  },
  {
    id: "hq-3",
    displayName: "STC HQ Admin",
    email: "hq.stc@parcela.app",
    phone: "0200000003",
    operatorCode: "STC",
    status: "active",
    lastSignInAt: "2026-07-08T19:02:00.000Z",
  },
];

export const PLATFORM_USERS: PlatformUserRow[] = [
  {
    id: "u-hq-1",
    displayName: "HQ Administrator",
    email: "hq.admin@parcela.app",
    phone: "0200000001",
    role: "hq_admin",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: null,
    status: "pending_setup",
    lastSignInAt: "2026-07-08T10:12:00.000Z",
  },
  {
    id: "u-hq-2",
    displayName: "VIP HQ Admin",
    email: "hq.vip@parcela.app",
    phone: "0200000002",
    role: "hq_admin",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: null,
    status: "active",
    lastSignInAt: "2026-07-08T21:40:00.000Z",
  },
  {
    id: "u-hq-3",
    displayName: "STC HQ Admin",
    email: "hq.stc@parcela.app",
    phone: "0200000003",
    role: "hq_admin",
    operatorCode: "STC",
    operatorName: "STC Transport",
    stationName: null,
    status: "active",
    lastSignInAt: "2026-07-08T19:02:00.000Z",
  },
  {
    id: "u-lead-1",
    displayName: "Ama Mensah",
    email: "lead.accra@vip.parcela.app",
    phone: "0244111001",
    role: "branch_lead",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: "Accra Circle",
    status: "active",
    lastSignInAt: "2026-07-08T17:22:00.000Z",
  },
  {
    id: "u-lead-2",
    displayName: "Kwesi Boateng",
    email: "lead.kumasi@vip.parcela.app",
    phone: "0244111002",
    role: "branch_lead",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: "Kumasi Kejetia",
    status: "locked",
    lastSignInAt: "2026-07-06T09:10:00.000Z",
  },
  {
    id: "u-lead-3",
    displayName: "Efua Asante",
    email: "lead.accra@stc.parcela.app",
    phone: "0244222001",
    role: "branch_lead",
    operatorCode: "STC",
    operatorName: "STC Transport",
    stationName: "Accra STC Yard",
    status: "active",
    lastSignInAt: "2026-07-08T15:48:00.000Z",
  },
  {
    id: "u-staff-1",
    displayName: "Yaw Owusu",
    email: "counter.accra1@vip.parcela.app",
    phone: "0244333001",
    role: "counter_staff",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: "Accra Circle",
    status: "active",
    lastSignInAt: "2026-07-08T20:05:00.000Z",
  },
  {
    id: "u-staff-2",
    displayName: "Abena Darko",
    email: "counter.accra2@vip.parcela.app",
    phone: "0244333002",
    role: "counter_staff",
    operatorCode: "VIP",
    operatorName: "VIP Transport",
    stationName: "Accra Circle",
    status: "active",
    lastSignInAt: "2026-07-08T18:33:00.000Z",
  },
  {
    id: "u-staff-3",
    displayName: "Kofi Adjei",
    email: "counter.kumasi@stc.parcela.app",
    phone: "0244444001",
    role: "counter_staff",
    operatorCode: "STC",
    operatorName: "STC Transport",
    stationName: "Kumasi STC",
    status: "locked",
    lastSignInAt: "2026-07-05T12:00:00.000Z",
  },
  {
    id: "u-staff-4",
    displayName: "Akosua Frimpong",
    email: "counter.takoradi@stc.parcela.app",
    phone: "0244444002",
    role: "counter_staff",
    operatorCode: "STC",
    operatorName: "STC Transport",
    stationName: "Takoradi STC",
    status: "pending_setup",
    lastSignInAt: null,
  },
];

export const PLATFORM_AUDIT: PlatformAuditRow[] = [
  {
    id: "a1",
    action: "HQ credentials issued",
    detail: "VIP · hq.admin@parcela.app",
    at: "2026-07-08T21:15:00.000Z",
  },
  {
    id: "a2",
    action: "Operator configured",
    detail: "STC Transport — HQ logins handed over",
    at: "2026-07-07T14:30:00.000Z",
  },
  {
    id: "a3",
    action: "HQ admin created",
    detail: "VIP · hq.vip@parcela.app",
    at: "2026-07-06T11:05:00.000Z",
  },
  {
    id: "a4",
    action: "Transport onboarded",
    detail: "VIP · 14 stations seeded",
    at: "2026-07-05T09:40:00.000Z",
  },
  {
    id: "a5",
    action: "Login reset",
    detail: "VIP · lead.kumasi@vip.parcela.app (branch lead)",
    at: "2026-07-06T11:40:00.000Z",
  },
  {
    id: "a6",
    action: "Transport onboarded",
    detail: "STC · 13 stations seeded",
    at: "2026-07-04T16:20:00.000Z",
  },
  {
    id: "a7",
    action: "HQ credentials issued",
    detail: "STC · hq.stc@parcela.app",
    at: "2026-07-07T15:10:00.000Z",
  },
  {
    id: "a8",
    action: "Login reset",
    detail: "VIP · counter.accra@vip.parcela.app (counter staff)",
    at: "2026-07-08T08:55:00.000Z",
  },
  {
    id: "a9",
    action: "Operator configured",
    detail: "VIP Transport — branding and network saved",
    at: "2026-07-05T17:45:00.000Z",
  },
  {
    id: "a10",
    action: "HQ admin created",
    detail: "STC · hq.stc@parcela.app",
    at: "2026-07-04T17:00:00.000Z",
  },
  {
    id: "a11",
    action: "Login reset",
    detail: "STC · lead.tema@stc.parcela.app (branch lead)",
    at: "2026-07-03T13:25:00.000Z",
  },
  {
    id: "a12",
    action: "HQ credentials issued",
    detail: "VIP · hq.vip@parcela.app",
    at: "2026-07-06T12:30:00.000Z",
  },
];

export function parsePlatformAuditOperator(detail: string) {
  const match = detail.match(/^([A-Z]{2,8})\s·/);
  if (match) return match[1];
  const nameMatch = detail.match(/^([A-Za-z0-9\s]+)\s—/);
  if (nameMatch) {
    const operator = PLATFORM_OPERATORS.find((row) => nameMatch[1].trim().startsWith(row.name));
    return operator?.code ?? null;
  }
  return null;
}

export function getPlatformAuditStats(rows = PLATFORM_AUDIT) {
  const counts: Record<PlatformAuditKind, number> = {
    onboard: 0,
    configure: 0,
    credentials: 0,
    access: 0,
    other: 0,
  };
  for (const row of rows) {
    counts[getPlatformAuditKind(row.action)] += 1;
  }
  return {
    total: rows.length,
    ...counts,
    thisWeek: rows.filter((row) => {
      const at = new Date(row.at).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return at >= weekAgo;
    }).length,
  };
}

export function operatorStatusLabel(status: PlatformOperatorStatus) {
  if (status === "configured") return "Configured";
  if (status === "configure") return "Configure";
  if (status === "suspended") return "Suspended";
  return "Draft";
}

export function platformSubscriptionPlanLabel(plan: PlatformSubscriptionPlan | null) {
  if (plan === "annual") return "Annual licence";
  if (plan === "trial") return "Trial";
  return "Not subscribed";
}

export function platformSubscriptionStatusLabel(status: PlatformSubscriptionStatus) {
  if (status === "active") return "Paid · active";
  if (status === "expiring") return "Renewal due";
  if (status === "expired") return "Expired";
  return "Unpaid";
}

function subscriptionMsRemaining(expiresAt: string | null, now = Date.now()) {
  if (!expiresAt) return null;
  return new Date(expiresAt).getTime() - now;
}

export function getOperatorSubscriptionSnapshot(
  operator: PlatformOperatorRow,
  now = Date.now(),
): PlatformSubscriptionSnapshot {
  if (!operator.subscriptionPlan || !operator.subscriptionExpiresAt) {
    return {
      status: "unpaid",
      daysRemaining: null,
      planLabel: platformSubscriptionPlanLabel(operator.subscriptionPlan),
      expiresLabel: "—",
      paidLabel: "—",
      dueReminder: null,
      nextReminderLabel: null,
      progressPercent: 0,
    };
  }

  const msRemaining = subscriptionMsRemaining(operator.subscriptionExpiresAt, now)!;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const status: PlatformSubscriptionStatus =
    daysRemaining < 0 ? "expired" : daysRemaining <= 30 ? "expiring" : "active";

  const dueReminder = getDueRenewalReminder(daysRemaining, operator.renewalRemindersSent);
  const nextReminderLabel = dueReminder
    ? `${SUBSCRIPTION_REMINDER_DAYS[dueReminder]}-day countdown email`
    : null;

  const paidAt = operator.subscriptionPaidAt
    ? new Date(operator.subscriptionPaidAt).getTime()
    : null;
  const expiresAt = new Date(operator.subscriptionExpiresAt).getTime();
  const totalTerm = paidAt ? Math.max(expiresAt - paidAt, 1) : 365 * 24 * 60 * 60 * 1000;
  const elapsed = paidAt ? Math.min(Math.max(now - paidAt, 0), totalTerm) : 0;
  const progressPercent = Math.round((elapsed / totalTerm) * 100);

  return {
    status,
    daysRemaining: daysRemaining < 0 ? 0 : daysRemaining,
    planLabel: platformSubscriptionPlanLabel(operator.subscriptionPlan),
    expiresLabel: formatPlatformWhen(operator.subscriptionExpiresAt),
    paidLabel: operator.subscriptionPaidAt ? formatPlatformWhen(operator.subscriptionPaidAt) : "—",
    dueReminder,
    nextReminderLabel,
    progressPercent: Math.min(progressPercent, 100),
  };
}

export function getDueRenewalReminder(
  daysRemaining: number,
  sent: PlatformRenewalReminder[],
): PlatformRenewalReminder | null {
  if (daysRemaining < 0) {
    return sent.includes("1d") ? null : "1d";
  }

  const order: PlatformRenewalReminder[] = ["30d", "14d", "7d", "1d"];
  for (const reminder of order) {
    const threshold = SUBSCRIPTION_REMINDER_DAYS[reminder];
    if (daysRemaining <= threshold && !sent.includes(reminder)) {
      return reminder;
    }
  }
  return null;
}

export function formatSubscriptionCountdown(daysRemaining: number | null) {
  if (daysRemaining === null) return "Not paid";
  if (daysRemaining <= 0) return "Expired";
  if (daysRemaining === 1) return "1 day left";
  return `${daysRemaining} days left`;
}

export function getPlatformSubscriptionStats(operators = PLATFORM_OPERATORS, now = Date.now()) {
  let active = 0;
  let expiring = 0;
  let expired = 0;
  let unpaid = 0;
  let remindersDue = 0;

  for (const operator of operators) {
    const snapshot = getOperatorSubscriptionSnapshot(operator, now);
    if (snapshot.status === "active") active += 1;
    if (snapshot.status === "expiring") expiring += 1;
    if (snapshot.status === "expired") expired += 1;
    if (snapshot.status === "unpaid") unpaid += 1;
    if (snapshot.dueReminder) remindersDue += 1;
  }

  return { active, expiring, expired, unpaid, remindersDue, total: operators.length };
}

export function getPlatformOverviewStats(
  operators = PLATFORM_OPERATORS,
  users = PLATFORM_USERS,
) {
  const hqAdmins = PLATFORM_HQ_ADMINS;
  return {
    operatorsConfigured: operators.filter((o) => o.status === "configured").length,
    operatorsConfigure: operators.filter((o) => o.status === "configure" || o.status === "draft")
      .length,
    operatorsTotal: operators.length,
    hqAdminsActive: hqAdmins.filter((a) => a.status === "active").length,
    hqAdminsPending: hqAdmins.filter((a) => a.status === "pending_setup").length,
    hqAdminsTotal: hqAdmins.length,
    stationsSeeded: operators.reduce((sum, o) => sum + o.stationCount, 0),
    usersLocked: users.filter((u) => u.status === "locked").length,
    usersActive: users.filter((u) => u.status === "active").length,
    usersTotal: users.length,
  };
}

export function formatPlatformWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function hqAdminsForOperator(code: string) {
  return PLATFORM_HQ_ADMINS.filter(
    (a) => a.operatorCode.toUpperCase() === code.trim().toUpperCase(),
  );
}

export function isKnownBrandOperator(code: string): code is "VIP" | "STC" {
  return code === "VIP" || code === "STC";
}

export function platformUserRoleLabel(role: PlatformUserRole) {
  if (role === "hq_admin") return "HQ admin";
  if (role === "branch_lead") return "Branch lead";
  return "Counter staff";
}

export function platformUserStatusLabel(status: PlatformUserStatus) {
  if (status === "active") return "Active";
  if (status === "locked") return "Locked";
  if (status === "pending_setup") return "Setup pending";
  return "Inactive";
}

export function getPlatformUserStats(users = PLATFORM_USERS) {
  return {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    locked: users.filter((u) => u.status === "locked").length,
    pending: users.filter((u) => u.status === "pending_setup").length,
  };
}

export type PlatformBranchSnapshot = {
  stationName: string;
  lead: PlatformUserRow | null;
  staff: PlatformUserRow[];
  activeCount: number;
  totalCount: number;
  /** Branch has at least one active lead or counter staff. */
  isActive: boolean;
};

export type HqNetworkSnapshot = {
  operator: PlatformOperatorRow | null;
  hqTeam: PlatformHqAdminRow[];
  branches: PlatformBranchSnapshot[];
  stats: {
    hqTotal: number;
    hqActive: number;
    branchTotal: number;
    branchesActive: number;
    staffTotal: number;
    staffActive: number;
  };
};

export function getHqNetworkForOperator(
  operatorCode: string,
  hqAdmins = PLATFORM_HQ_ADMINS,
  users = PLATFORM_USERS,
  operators = PLATFORM_OPERATORS,
): HqNetworkSnapshot {
  const code = operatorCode.trim().toUpperCase();
  const operator = operators.find((o) => o.code.toUpperCase() === code) ?? null;
  const hqTeam = hqAdmins.filter((a) => a.operatorCode.toUpperCase() === code);

  const fieldUsers = users.filter(
    (u) => u.operatorCode.toUpperCase() === code && u.role !== "hq_admin",
  );

  const stationNames = Array.from(
    new Set(fieldUsers.map((u) => u.stationName).filter(Boolean) as string[]),
  ).sort();

  const branches: PlatformBranchSnapshot[] = stationNames.map((stationName) => {
    const atStation = fieldUsers.filter((u) => u.stationName === stationName);
    const lead = atStation.find((u) => u.role === "branch_lead") ?? null;
    const staff = atStation.filter((u) => u.role === "counter_staff");
    const allAtBranch = lead ? [lead, ...staff] : staff;
    const activeCount = allAtBranch.filter((u) => u.status === "active").length;

    return {
      stationName,
      lead,
      staff,
      activeCount,
      totalCount: allAtBranch.length,
      isActive:
        activeCount > 0 &&
        (lead?.status === "active" || staff.some((member) => member.status === "active")),
    };
  });

  return {
    operator,
    hqTeam,
    branches,
    stats: {
      hqTotal: hqTeam.length,
      hqActive: hqTeam.filter((h) => h.status === "active").length,
      branchTotal: branches.length,
      branchesActive: branches.filter((b) => b.isActive).length,
      staffTotal: fieldUsers.length,
      staffActive: fieldUsers.filter((u) => u.status === "active").length,
    },
  };
}

export type PlatformSupportKind =
  | "configure_operator"
  | "pending_hq"
  | "locked_user"
  | "pending_user"
  | "subscription_renewal";

export type PlatformSupportRow = {
  id: string;
  kind: PlatformSupportKind;
  title: string;
  subtitle: string;
  operatorCode: string;
  actionLabel: string;
  href: string;
};

export function platformSupportKindLabel(kind: PlatformSupportKind) {
  if (kind === "configure_operator") return "Configure";
  if (kind === "pending_hq") return "HQ setup";
  if (kind === "locked_user") return "Locked";
  if (kind === "subscription_renewal") return "Renewal";
  return "Setup pending";
}

export function getPlatformSupportQueue(
  operators = PLATFORM_OPERATORS,
  hqAdmins = PLATFORM_HQ_ADMINS,
  users = PLATFORM_USERS,
): PlatformSupportRow[] {
  const rows: PlatformSupportRow[] = [];

  for (const op of operators) {
    const subscription = getOperatorSubscriptionSnapshot(op);
    if (subscription.dueReminder || subscription.status === "expired") {
      rows.push({
        id: `sub-${op.id}`,
        kind: "subscription_renewal",
        title: op.name,
        subtitle:
          subscription.status === "expired"
            ? "Annual licence expired — chase payment"
            : `${formatSubscriptionCountdown(subscription.daysRemaining)} · send ${subscription.nextReminderLabel ?? "renewal email"}`,
        operatorCode: op.code,
        actionLabel: subscription.dueReminder ? "Send reminder" : "View",
        href: "/platform",
      });
    }

    if (op.status === "configure" || op.status === "draft") {
      rows.push({
        id: `op-${op.id}`,
        kind: "configure_operator",
        title: op.name,
        subtitle: op.primaryAdminEmail
          ? `Finish configuration · ${op.primaryAdminEmail}`
          : "No HQ admin assigned yet",
        operatorCode: op.code,
        actionLabel: "Configure",
        href: "/platform/operators",
      });
    }
  }

  for (const hq of hqAdmins) {
    if (hq.status === "pending_setup") {
      rows.push({
        id: `hq-${hq.id}`,
        kind: "pending_hq",
        title: hq.displayName,
        subtitle: hq.email,
        operatorCode: hq.operatorCode,
        actionLabel: "Issue login",
        href: "/platform/hq-admins",
      });
    }
  }

  for (const user of users) {
    if (user.status === "locked") {
      rows.push({
        id: `user-locked-${user.id}`,
        kind: "locked_user",
        title: user.displayName,
        subtitle: `${user.email} · ${platformUserRoleLabel(user.role)}`,
        operatorCode: user.operatorCode,
        actionLabel: "Reset login",
        href: "/platform/users",
      });
    } else if (user.status === "pending_setup") {
      rows.push({
        id: `user-pending-${user.id}`,
        kind: "pending_user",
        title: user.displayName,
        subtitle: `${user.email} · ${platformUserRoleLabel(user.role)}`,
        operatorCode: user.operatorCode,
        actionLabel: "View user",
        href: "/platform/users",
      });
    }
  }

  return rows;
}
