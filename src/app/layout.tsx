import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import {
  getCategories,
  getProducts,
  getSiteSettings,
} from "@/lib/data-service";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export const revalidate = 60;

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const defaultTitle = `${settings.name} | ${settings.tagline}`;
  const ogImage = toAbsoluteUrl("/images/hero-leather.jpg", siteUrl);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${settings.name}`,
    },
    description: settings.description,
    icons: {
      icon: settings.logos.mark,
      apple: settings.logos.mark,
    },
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: defaultTitle,
      description: settings.description,
      url: siteUrl,
      siteName: settings.name,
      locale: "vi_VN",
      type: "website",
      images: [{ url: ogImage, alt: defaultTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: settings.description,
      images: [ogImage],
    },
  };
}

const splashBootstrapScript = `(function(){try{var r=document.documentElement;if(window.location.pathname.indexOf('/admin')===0){r.setAttribute('data-splash','off');return;}var m=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var d=window.sessionStorage&&window.sessionStorage.getItem('ag_splash_done')==='1';if(m||d){r.setAttribute('data-splash','off');return;}if(window.location.pathname!=='/'){r.setAttribute('data-splash-mode','spin');}}catch(e){document.documentElement.setAttribute('data-splash','off');}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, categories, products] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getProducts(),
  ]);

  return (
    <html lang="vi" className={montserrat.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashBootstrapScript }} />
        <noscript>
          <style>{`.ny-splash{display:none!important}.v2 .v2-reveal,.v2 [data-reveal],.v2 .v2-split-char,.v2 .v2-split-word,.v2 .v2-bst-card,.v2 .v2-hotspot{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased bg-[#141619] text-white">
        <AppShell settings={settings} categories={categories} products={products}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
