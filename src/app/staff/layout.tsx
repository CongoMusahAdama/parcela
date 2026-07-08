export default function StaffLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="staff-portal min-h-dvh w-full bg-[#eef2f6] font-body">{children}</div>;
}
