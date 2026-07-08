import type { BranchSummary, CreateTeamMemberResult, LeadSession, LeadTeamMember } from "@/types/lead";
import type { StaffAccount } from "@/types/staff";
import type { StaffParcelSummary } from "@/types/staff-parcel";
import { MOCK_STATIONS } from "@/lib/stations";
import type { Station } from "@/types/parcel";

/** Demo credentials — kept in sync with LEAD_ACCOUNTS below. */
export const DEMO_LEAD_LOGINS = [
  {
    phone: "0244555666",
    pin: "123456",
    operator: "VIP" as const,
    stationName: "Circle Terminal",
    displayName: "Kofi Mensah",
  },
  {
    phone: "0244777888",
    pin: "123456",
    operator: "STC" as const,
    stationName: "Tema Terminal",
    displayName: "Akosua Darko",
  },
];

/** Lead portal UI-only mode — set NEXT_PUBLIC_LEAD_USE_DEMO_DATA=true to use local demo data. */
export const LEAD_USE_DEMO_DATA =
  process.env.NEXT_PUBLIC_LEAD_USE_DEMO_DATA === "true";

const DEMO_DELAY_MS = 280;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), DEMO_DELAY_MS));
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `0${digits.slice(3)}`;
  return digits.startsWith("0") ? digits : `0${digits}`;
}

function demoToken(stationId: string): string {
  return `demo-lead-${stationId}`;
}

function stationIdFromToken(token: string): string | null {
  if (!token.startsWith("demo-lead-")) return null;
  return token.slice("demo-lead-".length) || null;
}

const LEAD_ACCOUNTS: Record<
  string,
  LeadSession["staff"] & { pin: string }
> = {
  "0244555666": {
    id: "lead-circle-01",
    displayName: "Kofi Mensah",
    email: "kofi.mensah@parcela.lead",
    phone: "0244555666",
    pin: "123456",
    role: "station_lead",
    operator: "VIP",
    stationId: "acc-circle-vip",
    stationName: "Circle Terminal",
    stationCode: "VIP-CRL",
    active: true,
  },
  "0531878243": {
    id: "lead-test-01",
    displayName: "Branch Lead Test",
    email: "lead.test@parcela.lead",
    phone: "0531878243",
    pin: "Lead12345",
    role: "station_lead",
    operator: "VIP",
    stationId: "acc-circle-vip",
    stationName: "Circle Terminal",
    stationCode: "VIP-CRL",
    active: true,
  },
  "0244777888": {
    id: "lead-tema-01",
    displayName: "Akosua Darko",
    email: "akosua.darko@parcela.lead",
    phone: "0244777888",
    pin: "123456",
    role: "station_lead",
    operator: "STC",
    stationId: "acc-tema-stc",
    stationName: "Tema Terminal",
    stationCode: "STC-TEM",
    active: true,
  },
};

function isoTodayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function withSession(
  member: StaffAccount,
  session: Pick<LeadTeamMember, "online" | "lastLoginAt" | "lastLogoutAt" | "parcelsHandledToday">,
): LeadTeamMember {
  return { ...member, ...session };
}

const BASE_TEAM: Record<string, LeadTeamMember[]> = {
  "acc-circle-vip": [
    withSession(
      {
        id: "staff-circle-02",
        displayName: "Yaw Asante",
        email: "yaw.asante@parcela.staff",
        phone: "0244111222",
        role: "station_staff",
        operator: "VIP",
        stationId: "acc-circle-vip",
        stationName: "Circle Terminal",
        stationCode: "VIP-CRL",
        active: true,
        location: "Circle, Accra",
      },
      {
        online: true,
        lastLoginAt: isoTodayAt(8, 12),
        lastLogoutAt: null,
        parcelsHandledToday: 14,
      },
    ),
    withSession(
      {
        id: "staff-circle-03",
        displayName: "Abena Osei",
        email: "abena.osei@parcela.staff",
        phone: "0244333444",
        role: "station_staff",
        operator: "VIP",
        stationId: "acc-circle-vip",
        stationName: "Circle Terminal",
        stationCode: "VIP-CRL",
        active: true,
        location: "Circle, Accra",
      },
      {
        online: false,
        lastLoginAt: isoTodayAt(7, 45),
        lastLogoutAt: isoTodayAt(12, 30),
        parcelsHandledToday: 9,
      },
    ),
  ],
  "acc-kaneshie": [
    withSession(
      {
        id: "staff-kaneshie-01",
        displayName: "Ama Serwaa",
        email: "ama.serwaa@parcela.staff",
        phone: "0244123456",
        role: "station_staff",
        operator: "VIP",
        stationId: "acc-kaneshie",
        stationName: "Kaneshie Terminal",
        stationCode: "VIP-KNH",
        active: true,
        location: "Kaneshie, Accra",
      },
      {
        online: false,
        lastLoginAt: isoTodayAt(7, 30),
        lastLogoutAt: isoTodayAt(11, 0),
        parcelsHandledToday: 6,
      },
    ),
  ],
  "acc-tema-stc": [
    withSession(
      {
        id: "staff-tema-01",
        displayName: "Efua Boateng",
        email: "efua.boateng@parcela.staff",
        phone: "0244987654",
        role: "station_staff",
        operator: "STC",
        stationId: "acc-tema-stc",
        stationName: "Tema Terminal",
        stationCode: "STC-TEM",
        active: true,
        location: "Tema, Greater Accra",
      },
      {
        online: true,
        lastLoginAt: isoTodayAt(9, 5),
        lastLogoutAt: null,
        parcelsHandledToday: 11,
      },
    ),
    withSession(
      {
        id: "staff-tema-02",
        displayName: "Kwame Adjei",
        email: "kwame.adjei@parcela.staff",
        phone: "0244999000",
        role: "station_staff",
        operator: "STC",
        stationId: "acc-tema-stc",
        stationName: "Tema Terminal",
        stationCode: "STC-TEM",
        active: false,
        location: "Tema, Greater Accra",
      },
      {
        online: false,
        lastLoginAt: isoTodayAt(6, 20),
        lastLogoutAt: isoTodayAt(10, 15),
        parcelsHandledToday: 0,
      },
    ),
  ],
};

const teamByStation = new Map<string, LeadTeamMember[]>(
  Object.entries(BASE_TEAM).map(([stationId, members]) => [
    stationId,
    members.map((member) => ({ ...member })),
  ]),
);

function isoDaysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 30, 0, 0);
  return date.toISOString();
}

function buildDemoParcels(stationId: string, stationName: string, operator: "VIP" | "STC"): StaffParcelSummary[] {
  const peerStation =
    operator === "VIP"
      ? { id: "acc-kaneshie", name: "Kaneshie Terminal" }
      : { id: "acc-circle-vip", name: "Circle Terminal" };

  return [
    {
      bookingReference: "PCL-2401",
      pickupCode: "482910",
      status: "pending_dropoff",
      senderName: "Ama Serwaa",
      senderPhone: "0244123456",
      recipientName: "Kojo Mensah",
      recipientPhone: "0244987001",
      originStationName: stationName,
      destinationStationName: peerStation.name,
      originStationId: stationId,
      destinationStationId: peerStation.id,
      itemCount: 1,
      direction: "outgoing",
      items: [{ parcelType: "box", description: "Documents", fragile: false }],
      createdAt: isoDaysAgo(0, 8),
      updatedAt: isoDaysAgo(0, 8),
    },
    {
      bookingReference: "PCL-2402",
      pickupCode: "193847",
      status: "in_transit",
      senderName: "Efua Boateng",
      senderPhone: "0244987654",
      recipientName: "Nana Yaa",
      recipientPhone: "0244555012",
      originStationName: stationName,
      destinationStationName: peerStation.name,
      originStationId: stationId,
      destinationStationId: peerStation.id,
      itemCount: 2,
      direction: "outgoing",
      busNumber: operator === "VIP" ? "VIP-204" : "STC-88",
      items: [
        { parcelType: "other", description: "Clothing", fragile: false },
        { parcelType: "envelope", description: "ID copies", fragile: false },
      ],
      createdAt: isoDaysAgo(1, 9),
      updatedAt: isoDaysAgo(0, 11),
    },
    {
      bookingReference: "PCL-2403",
      pickupCode: "774201",
      status: "ready_for_collection",
      senderName: "Kwame Adjei",
      senderPhone: "0244999000",
      recipientName: "Akosua Darko",
      recipientPhone: "0244777888",
      originStationName: peerStation.name,
      destinationStationName: stationName,
      originStationId: peerStation.id,
      destinationStationId: stationId,
      itemCount: 1,
      direction: "incoming",
      busNumber: operator === "VIP" ? "VIP-118" : "STC-42",
      items: [{ parcelType: "box", description: "Electronics", fragile: true }],
      createdAt: isoDaysAgo(2, 14),
      updatedAt: isoDaysAgo(0, 7),
    },
    {
      bookingReference: "PCL-2404",
      pickupCode: "556812",
      status: "collected",
      senderName: "Yaw Asante",
      senderPhone: "0244111222",
      recipientName: "Abena Osei",
      recipientPhone: "0244333444",
      originStationName: stationName,
      destinationStationName: peerStation.name,
      originStationId: stationId,
      destinationStationId: peerStation.id,
      itemCount: 1,
      direction: "outgoing",
      busNumber: operator === "VIP" ? "VIP-301" : "STC-15",
      items: [{ parcelType: "other", description: "Household items", fragile: false }],
      createdAt: isoDaysAgo(3, 10),
      updatedAt: isoDaysAgo(0, 6),
    },
    {
      bookingReference: "PCL-2405",
      pickupCode: "902134",
      status: "arrived",
      senderName: "Kofi Mensah",
      senderPhone: "0244555666",
      recipientName: "Maame Afia",
      recipientPhone: "0244666777",
      originStationName: peerStation.name,
      destinationStationName: stationName,
      originStationId: peerStation.id,
      destinationStationId: stationId,
      itemCount: 3,
      direction: "incoming",
      busNumber: operator === "VIP" ? "VIP-090" : "STC-71",
      items: [
        { parcelType: "box", description: "Books", fragile: false },
        { parcelType: "other", description: "Shoes", fragile: false },
        { parcelType: "envelope", description: "Certificates", fragile: true },
      ],
      createdAt: isoDaysAgo(1, 16),
      updatedAt: isoDaysAgo(0, 9),
    },
    {
      bookingReference: "PCL-2406",
      pickupCode: "331902",
      status: "in_transit",
      senderName: "Daniel Owusu",
      senderPhone: "0244222333",
      recipientName: "Grace Mensah",
      recipientPhone: "0244888999",
      originStationName: stationName,
      destinationStationName: peerStation.name,
      originStationId: stationId,
      destinationStationId: peerStation.id,
      itemCount: 1,
      direction: "outgoing",
      busNumber: operator === "VIP" ? "VIP-512" : "STC-33",
      items: [{ parcelType: "other", description: "Food items", fragile: false }],
      createdAt: isoDaysAgo(0, 12),
      updatedAt: isoDaysAgo(0, 13),
    },
  ];
}

const parcelsByStation = new Map<string, StaffParcelSummary[]>(
  DEMO_LEAD_LOGINS.map((demo) => {
    const account = LEAD_ACCOUNTS[demo.phone]!;
    return [
      account.stationId,
      buildDemoParcels(account.stationId, account.stationName, demo.operator),
    ];
  }),
);

function summarizeParcels(parcels: StaffParcelSummary[], stationId: string): BranchSummary {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const counts = {
    total: parcels.length,
    pending_dropoff: 0,
    in_transit: 0,
    arrived: 0,
    ready_for_collection: 0,
    collected: 0,
    outgoing: 0,
    incoming: 0,
    updatedToday: 0,
  };

  for (const parcel of parcels) {
    if (parcel.status === "pending_dropoff" && parcel.originStationId === stationId) {
      counts.pending_dropoff++;
    } else if (parcel.status === "in_transit") counts.in_transit++;
    else if (parcel.status === "arrived" && parcel.destinationStationId === stationId) {
      counts.arrived++;
    } else if (
      parcel.status === "ready_for_collection" &&
      parcel.destinationStationId === stationId
    ) {
      counts.ready_for_collection++;
    } else if (parcel.status === "collected") counts.collected++;

    if (parcel.direction === "outgoing") counts.outgoing++;
    if (parcel.direction === "incoming") counts.incoming++;
    if (new Date(parcel.updatedAt) >= todayStart) counts.updatedToday++;
  }

  return {
    stationId,
    counts,
    generatedAt: new Date().toISOString(),
  };
}

export async function demoLeadLoginApi(phone: string, pin: string): Promise<LeadSession> {
  const normalized = normalizePhone(phone);
  const trimmedPin = pin.trim();
  const account = LEAD_ACCOUNTS[normalized];

  if (account && account.pin === trimmedPin) {
    const { pin: _pin, ...staff } = account;
    return delay({
      token: demoToken(staff.stationId),
      staff,
      signedInAt: new Date().toISOString(),
    });
  }

  throw new Error("Invalid phone number or PIN.");
}

export async function demoFetchLeadSummary(token: string): Promise<BranchSummary> {
  const stationId = stationIdFromToken(token);
  if (!stationId) throw new Error("Demo session expired. Sign in again.");

  const parcels = parcelsByStation.get(stationId) ?? [];
  return delay(summarizeParcels(parcels, stationId));
}

export async function demoFetchLeadParcels(token: string): Promise<StaffParcelSummary[]> {
  const stationId = stationIdFromToken(token);
  if (!stationId) throw new Error("Demo session expired. Sign in again.");

  return delay([...(parcelsByStation.get(stationId) ?? [])]);
}

function leadFromToken(token: string) {
  const stationId = stationIdFromToken(token);
  if (!stationId) return null;
  return Object.values(LEAD_ACCOUNTS).find((account) => account.stationId === stationId) ?? null;
}

function branchStationsForLead(lead: LeadSession["staff"]): Station[] {
  const leadStation = MOCK_STATIONS.find((station) => station.id === lead.stationId);
  const city = leadStation?.city ?? "Accra";
  return MOCK_STATIONS.filter(
    (station) => station.city === city && station.operator === lead.operator,
  );
}

function branchTeamForLead(lead: LeadSession["staff"]): LeadTeamMember[] {
  const stationIds = new Set(branchStationsForLead(lead).map((station) => station.id));
  const seen = new Set<string>();
  const merged: LeadTeamMember[] = [];

  for (const members of teamByStation.values()) {
    for (const member of members) {
      if (!stationIds.has(member.stationId) || seen.has(member.id)) continue;
      seen.add(member.id);
      merged.push({ ...member });
    }
  }

  return merged;
}

export async function demoFetchLeadBranchStations(token: string) {
  const lead = leadFromToken(token);
  if (!lead) throw new Error("Demo session expired. Sign in again.");

  const stations = branchStationsForLead(lead);
  return delay({
    branchCity: MOCK_STATIONS.find((station) => station.id === lead.stationId)?.city ?? "Accra",
    stations,
  });
}

export async function demoFetchLeadTeam(token: string): Promise<LeadTeamMember[]> {
  const lead = leadFromToken(token);
  if (!lead) throw new Error("Demo session expired. Sign in again.");

  return delay(branchTeamForLead(lead));
}

export async function demoCreateLeadTeamMemberApi(
  token: string,
  body: { displayName: string; email: string; phone: string; stationId?: string },
): Promise<CreateTeamMemberResult> {
  const lead = leadFromToken(token);
  if (!lead) throw new Error("Demo session expired. Sign in again.");

  const stations = branchStationsForLead(lead);
  const targetStation =
    stations.find((station) => station.id === body.stationId) ?? stations[0];
  if (!targetStation) throw new Error("No terminals available in your branch city.");

  const team = teamByStation.get(targetStation.id) ?? [];
  const normalizedPhone = normalizePhone(body.phone);
  const id = `staff-demo-${normalizedPhone.slice(-4)}`;

  const staff: LeadTeamMember = {
    id,
    displayName: body.displayName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: normalizedPhone,
    location: `${targetStation.city} · ${targetStation.name}`,
    role: "station_staff",
    operator: lead.operator,
    stationId: targetStation.id,
    stationName: targetStation.name,
    stationCode: targetStation.code,
    active: true,
    online: false,
    lastLoginAt: null,
    lastLogoutAt: null,
    parcelsHandledToday: 0,
    mustChangePassword: true,
  };

  teamByStation.set(targetStation.id, [staff, ...team.filter((member) => member.id !== id)]);

  return delay({
    staff,
    smsSent: false,
    temporaryPasswordSent: true,
  });
}

export async function demoUpdateLeadTeamMemberApi(
  token: string,
  memberId: string,
  body: { displayName?: string; email?: string; phone?: string; active?: boolean },
): Promise<LeadTeamMember> {
  const lead = leadFromToken(token);
  if (!lead) throw new Error("Demo session expired. Sign in again.");

  const branchTeam = branchTeamForLead(lead);
  const current = branchTeam.find((member) => member.id === memberId);
  if (!current) throw new Error("Team member not found in your branch.");

  const team = teamByStation.get(current.stationId) ?? [];
  const index = team.findIndex((member) => member.id === memberId);
  if (index === -1) throw new Error("Team member not found in your branch.");
  if (body.email) {
    const email = body.email.trim().toLowerCase();
    const emailTaken = team.some(
      (member) => member.id !== memberId && member.email.toLowerCase() === email,
    );
    if (emailTaken) throw new Error("A staff account with this email already exists.");
  }

  if (body.phone) {
    const phoneTaken = team.some(
      (member) => member.id !== memberId && member.phone === body.phone?.trim(),
    );
    if (phoneTaken) throw new Error("A staff account with this phone already exists.");
  }

  const updated = {
    ...current,
    ...(body.displayName !== undefined ? { displayName: body.displayName.trim() } : {}),
    ...(body.email !== undefined ? { email: body.email.trim().toLowerCase() } : {}),
    ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
    ...(body.active !== undefined ? { active: body.active } : {}),
  };
  team[index] = updated;
  teamByStation.set(current.stationId, team);

  return delay({ ...updated });
}

export async function demoDeleteLeadTeamMemberApi(token: string, memberId: string) {
  const lead = leadFromToken(token);
  if (!lead) throw new Error("Demo session expired. Sign in again.");

  const branchTeam = branchTeamForLead(lead);
  const current = branchTeam.find((member) => member.id === memberId);
  if (!current) throw new Error("Team member not found in your branch.");

  const team = teamByStation.get(current.stationId) ?? [];
  teamByStation.set(
    current.stationId,
    team.filter((member) => member.id !== memberId),
  );

  return delay({ ok: true, deletedId: memberId });
}
