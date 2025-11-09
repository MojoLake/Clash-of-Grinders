import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const clash = localFont({
  src: [
    {
      path: "./fonts/Clash_Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Clash_Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-clash",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clash of Grinders",
  description: "Track your grind, compete with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${clash.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
