import type { Metadata } from 'next';
import './globals.css';
import { getSiteSettings } from '@/lib/settings';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: `${settings.siteName} | ${settings.slogan}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.seoDescription,
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

  return (
    <html lang="fr" className="scroll-smooth">
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
