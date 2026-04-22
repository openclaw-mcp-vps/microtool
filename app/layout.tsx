import type { Metadata } from "next";
import "./globals.css";

const title = "microtool";
const description =
  "Launch micro-SaaS tools in minutes with hosted auth, payments, and analytics built in.";

export const metadata: Metadata = {
  metadataBase: new URL("https://microtool.dev"),
  title: {
    default: `${title} | Ship Micro-Tools Faster`,
    template: `%s | ${title}`
  },
  description,
  openGraph: {
    title: `${title} | Ship Micro-Tools Faster`,
    description,
    url: "https://microtool.dev",
    siteName: "microtool",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Ship Micro-Tools Faster`,
    description
  },
  keywords: [
    "micro saas",
    "tool builder",
    "hosted tools",
    "stripe checkout",
    "launch fast"
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
