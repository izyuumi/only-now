import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "./font.css";
import "./bg.css";
import "./main.css";
import { Toaster } from "@/components/ui/toaster";
import Head from "next/head";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "OnlyNow",
  description: "Chat with your anyone in real time and only in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className}>
      <Head>
        <meta property="og:image" content="/preview.png" />
        <meta property="twitter:image" content="/preview.png" />
      </Head>
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
