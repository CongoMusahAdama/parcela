import { AdminOperatorShell } from "@/components/admin/AdminOperatorShell";

export default function AdminPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminOperatorShell>{children}</AdminOperatorShell>;
}
