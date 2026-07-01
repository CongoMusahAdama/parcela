import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Onest, Syne } from "next/font/google";
import { SplashGateProvider } from "@/components/brand/SplashGate";
import { SplashScreen } from "@/components/brand/SplashScreen";
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
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${onest.variable} ${jetbrainsMono.variable} min-h-dvh`}
      >
        <SplashGateProvider>
          <SplashScreen />
          {children}
        </SplashGateProvider>
      </body>
    </html>
  );
}
