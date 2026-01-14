import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "BSC/KPI System | Mi2 JSC",
  description: "Hệ thống quản lý Balanced Scorecard và KPI - Mi2 JSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <DashboardLayout>
          {children}
        </DashboardLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
