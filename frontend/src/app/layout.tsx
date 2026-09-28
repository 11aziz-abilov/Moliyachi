import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Smart Finance AI | Sun'iy Intellekt Moliyachi Platformasi",
  description: "Shaxsiy va oilaviy moliyaviy oqimlarni ovozli va matnli buyruqlar orqali markazlashgan boshqarish hamda AI Moliyachi analitikasi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
