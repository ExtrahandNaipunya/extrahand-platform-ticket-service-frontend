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
  // Inject runtime backend URL so client uses server env (CapRover), not build-time NEXT_PUBLIC_*
  const backendUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8001";
  const script = `window.__BACKEND_URL__=${JSON.stringify(backendUrl)};`;
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </head>
      <body className={`${inter.className} overflow-x-hidden`} suppressHydrationWarning={true}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
