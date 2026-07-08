"use client";

import { StationReportsView } from "@/components/staff/StationReportsView";
import { useLeadParcels } from "@/components/lead/LeadParcelsContext";
import { useLeadSession } from "@/components/lead/LeadOperatorShell";

export function LeadReportsView() {
  const { staff } = useLeadSession();
  const { parcels, loading } = useLeadParcels();

  return (
    <StationReportsView
      staff={staff}
      parcels={parcels}
      loading={loading}
      title="Station records"
      description="Generate management and operational reports for your branch. Preview first, then print or export for terminal record keeping."
      badge="Record keeping"
    />
  );
}
