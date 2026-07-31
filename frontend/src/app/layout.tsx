import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "PharmaLite",
  description: "Simple, fast inventory and sales for your pharmacy.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "PharmaLite",
    statusBarStyle: "default",
  },
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
      </body>
    </html>
  );
}
