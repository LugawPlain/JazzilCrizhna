import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import SocialLinksButton from "@/components/SocialLinksButton";
import Footer from "./components/Footer";
import Providers from "./components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yorticia | Jazzil Sarinas",
  description: "Model | Influencer | Ambassadress",
  openGraph: {
    title: "Yorticia | Jazzil Sarinas",
    description: "Model | Influencer | Ambassadress",
    url: "https://www.yorticia.com/",
    siteName: "Yorticia",
    images: [
      {
        url: "https://www.yorticia.com/Expanded_Background.webp",
        width: 1200,
        height: 630,
        alt: "Yorticia Portfolio Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/yhw8eck.css" />
        <link rel="icon" href="/Logoico.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />

          <SocialLinksButton />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
