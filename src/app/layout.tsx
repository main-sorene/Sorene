import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ServiceWorkerKiller } from "@/components/ServiceWorkerKiller";

export const metadata: Metadata = {
  title: "Sorene",
  description: "Sorene AI",
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
