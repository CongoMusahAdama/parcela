import { PlatformShell } from "@/components/platform/PlatformShell";

export default function PlatformPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PlatformShell>{children}</PlatformShell>;
}
