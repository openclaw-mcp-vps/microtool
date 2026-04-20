import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://microtool.dev"),
  title: {
    default: "microtool | Ship Micro-SaaS Tools In Minutes",
    template: "%s | microtool"
  },
  description:
    "Build and deploy single-purpose micro-tools with config files instead of boilerplate. Get auth, Lemon Squeezy payments, and hosted subdomains out of the box.",
  openGraph: {
    title: "microtool | Ship Micro-SaaS Tools In Minutes",
    description:
      "A lightweight tool builder for solo devs and small teams. Upload config, launch a hosted micro-tool, and monetize immediately.",
    type: "website",
    siteName: "microtool",
    url: "https://microtool.dev"
  },
  twitter: {
    card: "summary_large_image",
    title: "microtool | Ship Micro-SaaS Tools In Minutes",
    description:
      "Stop rebuilding auth and payments for every idea. Launch profitable micro-tools in minutes."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${monoFont.variable} bg-[var(--bg)] text-[var(--text)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
