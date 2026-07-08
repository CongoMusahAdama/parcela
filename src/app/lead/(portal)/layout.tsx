import { LeadOperatorShell } from "@/components/lead/LeadOperatorShell";

export default function LeadPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LeadOperatorShell>{children}</LeadOperatorShell>;
}
