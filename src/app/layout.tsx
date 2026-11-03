import type { Metadata, Viewport } from "next";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { getMessages } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { getPreferences } from "@/lib/i18n/server";
import { THEME_SWATCHES } from "@/lib/preferences";
import { getLogoUrl } from "@/services/settings.service";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aletheia Cosmo & Gift",
  description: "Inventory and sales for Aletheia Cosmo & Gift",
};

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getPreferences();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: THEME_SWATCHES[theme][0],
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ theme, locale }, logoUrl] = await Promise.all([getPreferences(), getLogoUrl()]);

  return (
    <html lang={locale} data-theme={theme} className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">
        <I18nProvider messages={getMessages(locale)} locale={locale} theme={theme} logoUrl={logoUrl}>
          <TelegramProvider>{children}</TelegramProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
