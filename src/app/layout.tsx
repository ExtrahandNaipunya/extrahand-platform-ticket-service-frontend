/// <reference types="react" />
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ExtraHand Ticket Management Portal",
  description: "ExtraHand Ticket Management Portal - Manage customer support and live chat sessions",
  keywords: ["ExtraHand", "support agent", "live chat", "customer service", "agent portal"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inject runtime backend URL so client uses server env (CapRover).
  // Prefer API_URL / NEXT_PUBLIC_API_URL (your CapRover config), then BACKEND_URL / NEXT_PUBLIC_BACKEND_URL.
  const backendUrl =
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://extrahand-ticket-service-backend.apps.extrahand.in";
  const script = `window.__BACKEND_URL__=${JSON.stringify(backendUrl)};`;
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </head>
      <body className={`${inter.className} extrahand-theme overflow-x-hidden`} suppressHydrationWarning={true}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
