import type { StaffParcelSummary } from "@/types/staff-parcel";

export function matchesStaffParcelQuery(parcel: StaffParcelSummary, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    parcel.bookingReference.toLowerCase().includes(q) ||
    parcel.pickupCode.toLowerCase().includes(q) ||
    parcel.senderName.toLowerCase().includes(q) ||
    parcel.recipientName.toLowerCase().includes(q) ||
    parcel.destinationStationName.toLowerCase().includes(q) ||
    parcel.originStationName.toLowerCase().includes(q)
  );
}

export function matchesStaffParcelSearch(parcel: StaffParcelSummary, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (matchesStaffParcelQuery(parcel, query)) return true;

  const phoneMatch =
    parcel.senderPhone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
    parcel.recipientPhone.replace(/\s/g, "").includes(q.replace(/\s/g, ""));

  if (phoneMatch) return true;

  return parcel.busNumber?.toLowerCase().includes(q) ?? false;
}
