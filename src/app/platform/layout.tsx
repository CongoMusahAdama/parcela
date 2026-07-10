import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Parcela Platform",
    template: "%s — Parcela Platform",
  },
  description: "Parcela internal platform for onboarding and supporting transport services.",
};

export default function PlatformRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="platform-portal min-h-dvh w-full bg-[#fafaf9] font-body text-stone-900">
      {children}
    </div>
  );
}
