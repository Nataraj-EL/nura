import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Nura — Privacy-First Menstrual Cycle & Wellness Companion",
  description: "A mindful, privacy-first companion for menstrual cycle mapping and body literacy. Your health data stays entirely yours, stored locally and securely.",
  keywords: ["menstrual cycle", "wellness tracker", "privacy-first tracker", "body literacy", "women health"],
  authors: [{ name: "Nura Team" }],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#E07A5F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import { PWARegister } from "@/components/pwa/PWARegister";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable} data-scroll-behavior="smooth">
      <head>
        {/* Basic SEO headers */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="font-sans antialiased text-nura-slate bg-nura-cream min-h-screen flex flex-col">
        {/* Skip to Main Content Link for Keyboard Accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-nura-terracotta focus:text-white focus:rounded-full"
        >
          Skip to main content
        </a>
        
        <AuthProvider>
          <PWARegister />
          <main id="main-content" className="flex-1 flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
