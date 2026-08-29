import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt";

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Cek Presensi Siswa - SMK Gajah Mungkur 1 Wuryantoro",
  description: "Layanan informasi kehadiran siswa untuk wali murid SMK Gajah Mungkur 1 Wuryantoro",
  manifest: "/presensi-ortu/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Presensi Ortu",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/presensi-ortu/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-neutral-900 text-slate-900 min-h-screen`}>
        <PwaInstallPrompt />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
