import type { StaffAccount, StaffSession } from "@/types/staff";

export type LeadSession = StaffSession;

export type LeadTeamMember = StaffAccount & {
  location?: string;
  online: boolean;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  parcelsHandledToday: number;
};

export type BranchSummary = {  stationId: string;
  counts: {
    total: number;
    pending_dropoff: number;
    in_transit: number;
    arrived: number;
    ready_for_collection: number;
    collected: number;
    outgoing: number;
    incoming: number;
    updatedToday: number;
  };
  generatedAt: string;
};

export type CreateTeamMemberResult = {
  staff: StaffSession["staff"];
  smsSent: boolean;
  temporaryPasswordSent?: boolean;
};
