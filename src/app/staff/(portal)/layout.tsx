import { StaffOperatorShell } from "@/components/staff/StaffOperatorShell";

export default function StaffPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <StaffOperatorShell>{children}</StaffOperatorShell>;
}
