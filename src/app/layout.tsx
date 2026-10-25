import type { Metadata } from 'next';
import './globals.css';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';
import { generateThemeCss } from '@/lib/colors';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = applySiteSettingsToText(settings.seoDescription, settings);
  return {
    title: {
      default: `${settings.siteName} | ${settings.slogan}`,
      template: `%s | ${settings.siteName}`,
    },
    description,
    icons: {
      icon: settings.faviconUrl || '/favicon.ico',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const favicon = settings.faviconUrl || '/favicon.ico';
  const dynamicThemeCss = generateThemeCss(
    settings.primaryColor,
    settings.secondaryColor,
    settings.accentColor
  );

  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="icon" href={favicon} />
        <link rel="shortcut icon" href={favicon} />
        <style
          id="dynamic-brand-theme"
          dangerouslySetInnerHTML={{ __html: dynamicThemeCss }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          {children}
          <CartDrawer />
          <CookieBanner />
        </CartProvider>
      </body>
    </html>
  );
}
