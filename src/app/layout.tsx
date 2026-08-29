import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Cek Presensi Siswa - SMK Gajah Mungkur 1 Wuryantoro",
  description: "Layanan informasi kehadiran siswa untuk wali murid SMK Gajah Mungkur 1 Wuryantoro",
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-slate-50 text-slate-900 min-h-screen`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
