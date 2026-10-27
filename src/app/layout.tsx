import type { Metadata } from 'next';
import './globals.css';
import { applySiteSettingsToText, getSiteSettings } from '@/lib/settings';
import { generateThemeCss } from '@/lib/colors';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import CookieBanner from '@/components/CookieBanner';

export const dynamic = 'force-dynamic';

// Icône livrée avec le site : flamme sur fond vert forêt, carrée, sans texte.
// Le nom est versionné pour que les navigateurs, qui gardent les favicons en
// cache très longtemps (parfois malgré les en-têtes HTTP), voient une URL
// neuve au lieu de resservir l'ancien logo blanc de 64×64.
const DEFAULT_FAVICON = '/favicon-v2.ico';
// Ancienne valeur par défaut restée en base : elle ne doit pas écraser la
// nouvelle icône. Un favicon réellement envoyé depuis l'admin, lui, est gardé.
const LEGACY_FAVICON = '/favicon.ico';

function resolveFavicon(settingsFaviconUrl?: string | null): string {
  if (!settingsFaviconUrl || settingsFaviconUrl === LEGACY_FAVICON) return DEFAULT_FAVICON;
  return settingsFaviconUrl;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = applySiteSettingsToText(settings.seoDescription, settings);
  const favicon = resolveFavicon(settings.faviconUrl);
  return {
    title: {
      default: `${settings.siteName} | ${settings.slogan}`,
      template: `%s | ${settings.siteName}`,
    },
    description,
    icons: {
      icon: [
        { url: favicon },
        { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
        { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
        { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
      ],
      shortcut: favicon,
      apple: [{ url: '/apple-touch-icon-v2.png', sizes: '180x180' }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const dynamicThemeCss = generateThemeCss(
    settings.primaryColor,
    settings.secondaryColor,
    settings.accentColor
  );

  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        {/* Les balises d'icônes sont générées par generateMetadata (icônes
            versionnées + apple-touch-icon), pour éviter les doublons. */}
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
