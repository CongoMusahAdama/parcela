export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="admin-portal min-h-dvh w-full bg-white font-body text-foreground">
      {children}
    </div>
  );
}
