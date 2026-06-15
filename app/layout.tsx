import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AtomicCursor from "./components/AtomicCursor";
import EightAssistant from "./components/EightAssistant";
import ScrollWatcher from "./components/scroll";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://twentyeightlab.com"),
  title: {
    default: "Twenty Eight Labs",
    template: "%s | Twenty Eight Labs",
  },
  description:
    "The parent company behind Atomix, building AI security research into practical products and tooling.",
  openGraph: {
    title: "Twenty Eight Labs",
    description:
      "AI security research, application security, and the parent company behind Atomix.",
    url: "https://twentyeightlab.com",
    siteName: "Twenty Eight Labs",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <EightAssistant />
        <AtomicCursor />
        <ScrollWatcher />
      </body>
    </html>
  );
}
