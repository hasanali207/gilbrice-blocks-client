import { LanguageProvider } from "@/components/Homepages/LanguageProvider";
import Providers from "@/providers/Providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gilbrice Blocks | Quality Concrete Blocks in Cameroon",
    template: "%s | Gilbrice Blocks",
  },

  description:
    "Gilbrice Blocks manufactures and supplies quality concrete blocks for residential, commercial, and construction projects in Cameroon. Request a quote for block orders, production, and delivery.",

  applicationName: "Gilbrice Blocks",

  keywords: [
    "Gilbrice Blocks",
    "Concrete Blocks Cameroon",
    "Concrete Block Manufacturer",
    "Cement Blocks",
    "Construction Materials Cameroon",
    "Hollow Concrete Blocks",
    "Solid Concrete Blocks",
    "Building Blocks",
    "Concrete Block Supplier",
    "Block Production",
    "Block Delivery",
    "Construction Materials Supplier",
    "Cameroon Construction",
  ],

  authors: [{ name: "Gilbrice Blocks" }],
  creator: "Gilbrice Blocks",
  publisher: "Gilbrice Blocks",

  metadataBase: new URL("https://blocks.gilbricelogisticgrp.com"),

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Gilbrice Blocks | Quality Concrete Blocks in Cameroon",
    description:
      "Your trusted partner for concrete block manufacturing, construction materials, order management, and delivery in Cameroon.",
    url: "https://blocks.gilbricelogisticgrp.com",
    siteName: "Gilbrice Blocks",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Gilbrice Blocks - Concrete Block Manufacturing",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Gilbrice Blocks | Quality Concrete Blocks",
    description:
      "Quality concrete blocks for construction projects in Cameroon. Contact Gilbrice Blocks for orders and delivery.",
    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.className} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <Providers>
          <LanguageProvider>{children}</LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
