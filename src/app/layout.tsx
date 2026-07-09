import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { AppToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { DataProvider } from "@/context/data-context";
import { BuyerProvider } from "@/context/buyer-context";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Previax — Explore Communities",
  description:
    "A cinematic real estate platform for exploring premium residential communities across North Carolina.",
  icons: {
    icon: "/previax-logo.png",
    apple: "/previax-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <DataProvider>
            <BuyerProvider>{children}</BuyerProvider>
          </DataProvider>
        </AuthProvider>
        <AppToaster />
      </body>
    </html>
  );
}
