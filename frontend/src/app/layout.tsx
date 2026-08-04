import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  applicationName: "PharmaLite",
  title: {
    default: "PharmaLite — Pharmacy Inventory & Sales",
    template: "%s · PharmaLite",
  },
  description: "Simple, fast inventory and sales for your pharmacy.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PharmaLite",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Phone numbers in inventory/sales shouldn't be auto-linked by the OS.
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c8563",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
