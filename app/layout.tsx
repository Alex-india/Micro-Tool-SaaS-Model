import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/constants";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthModal } from "@/components/auth/AuthModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#090a0f",
};

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "utility tools",
    "free online tools",
    "sip calculator",
    "emi calculator",
    "json formatter",
    "word counter",
    "pdf tools",
    "image compressor",
    "password generator",
    "qr generator",
  ],
  authors: [{ name: "ToolVerse Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`}>
      <body className="bg-background text-text-primary min-h-screen flex flex-col font-sans antialiased selection:bg-accent selection:text-white overflow-x-hidden">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 pb-12">
              {children}
            </main>
            <Footer />
            <AuthModal />
            <div id="google_translate_element" style={{ display: "none" }} />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
