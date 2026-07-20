import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Invoicely - Invoice & Payment Reminders for Freelancers",
  description:
    "Create GST-compliant invoices, send them via WhatsApp & email, and automate payment reminders. Built for Indian freelancers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
