import type { Metadata, Viewport } from "next";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aletheia Cosmo & Gift",
  description: "Inventory and sales for Aletheia Cosmo & Gift",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f3ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,620&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
