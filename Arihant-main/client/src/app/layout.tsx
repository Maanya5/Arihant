import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import Providers from "./providers";
import InitialLoader from "@/components/InitialLoader";
import RouteProgressBar from "@/components/RouteProgressBar";
import { Suspense } from "react";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-satoshi",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Arihant Store | School Uniforms Online",
    template: "%s | Arihant Store",
  },
  description:
    "Order high-quality school uniforms online. Trusted by parents across the city. Fast delivery, easy returns.",
  keywords: ["school uniforms", "uniform online", "Arihant store", "school kit", "buy uniform"],
  openGraph: {
    title: "Arihant Store — School Uniforms Online",
    description: "Premium quality school uniforms delivered to your doorstep.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${plusJakartaSans.variable} antialiased`} suppressHydrationWarning>
      <body className="flex flex-col font-sans min-h-screen" suppressHydrationWarning>
        <Providers>
          <InitialLoader />
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          {children}
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  );
}

