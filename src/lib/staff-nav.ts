import type { LucideIcon } from "lucide-react";
import {
  Bus,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Package,
  PackageCheck,
  QrCode,
  Search,
  ShieldCheck,
  Truck,
  UserPlus,
} from "lucide-react";

export type StaffNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type StaffNavSection = {
  title: string;
  items: StaffNavItem[];
};

export const STAFF_NAV_SECTIONS: StaffNavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        label: "Overview",
        href: "/staff/dashboard",
        icon: LayoutDashboard,
        description: "Today's parcel summary for your station.",
      },
    ],
  },
  {
    title: "Sender Desk",
    items: [
      {
        label: "New walk-in",
        href: "/staff/walk-in",
        icon: UserPlus,
        description: "Create a booking for a sender at your counter, then verify and log.",
      },
      {
        label: "Awaiting drop-off",
        href: "/staff/pending",
        icon: Package,
        description: "Sender bookings waiting for physical drop-off at your counter.",
      },
      {
        label: "Verify & log",
        href: "/staff/verify",
        icon: ClipboardCheck,
        description: "Confirm sender parcel details and assign the bus.",
      },
      {
        label: "In transit",
        href: "/staff/in-transit",
        icon: Truck,
        description: "Parcels already loaded and travelling on buses.",
      },
    ],
  },
  {
    title: "Receiver Desk",
    items: [
      {
        label: "Incoming buses",
        href: "/staff/arrived",
        icon: Bus,
        description: "Receive parcels from arriving buses and confirm handover.",
      },
      {
        label: "Collection queue",
        href: "/staff/collection",
        icon: PackageCheck,
        description: "Parcels already at the station waiting for recipient pickup.",
      },
      {
        label: "Recipient pickup",
        href: "/staff/release",
        icon: ShieldCheck,
        description: "Verify the pickup code and release the parcel to the recipient.",
      },
    ],
  },
  {
    title: "Shared Tools",
    items: [
      {
        label: "Search parcels",
        href: "/staff/search",
        icon: Search,
        description: "Find parcels by reference, sender, recipient, bus, or destination.",
      },
      {
        label: "Station booking QR",
        href: "/staff/station-qr",
        icon: QrCode,
        description: "Print a QR poster that opens booking for this station.",
      },
      {
        label: "Station records",
        href: "/staff/reports",
        icon: FileText,
        description: "Generate and download terminal reports for record keeping.",
      },
    ],
  },
];

export const STAFF_NAV_ITEMS = STAFF_NAV_SECTIONS.flatMap((section) => section.items);

export function getStaffNavItem(href: string): StaffNavItem | undefined {
  return STAFF_NAV_ITEMS.find((item) => item.href === href);
}
