import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ServiceWorkerKiller } from "@/components/ServiceWorkerKiller";

export const metadata: Metadata = {
  title: "Sorene | Your Business Companion",
  description: "Sorene — your personalized entrepreneurship coach.",
  icons: {
    icon: [
      { url: "/figmaAssets/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/figmaAssets/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerKiller />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
