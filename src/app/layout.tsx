import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Syne } from "next/font/google";
import { AppChrome } from "@/components/ui/AppChrome";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
  adjustFontFallback: true,
});

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
  adjustFontFallback: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parcela — Bus Parcel Booking",
  description:
    "Pre-book parcels at bus stations. No account needed. Track and collect with ease.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parcela",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${onest.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh overflow-x-hidden font-body text-foreground antialiased">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
