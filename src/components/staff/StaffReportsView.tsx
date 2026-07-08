"use client";

import { StationReportsView } from "@/components/staff/StationReportsView";
import { useStaffSession } from "@/components/staff/StaffOperatorShell";
import { useStaffParcels } from "@/components/staff/StaffParcelsContext";

export function StaffReportsView() {
  const { staff } = useStaffSession();
  const { parcels, loading } = useStaffParcels();

  return <StationReportsView staff={staff} parcels={parcels} loading={loading} />;
}
