import type { Metadata, Viewport } from "next";
import "./globals.css";
import TrackingPixels from "@/components/TrackingPixels";
import SourceCapture from "@/components/SourceCapture";
import { DEFAULT_CONFIG } from "@/lib/site-config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: DEFAULT_CONFIG.metaTitle,
  description: DEFAULT_CONFIG.metaDescription,
  keywords:
    "suplimente alimentare, suplimente naturiste, cosmetice naturale, snep, olivox, programe nutritionale, alimente functionale, uleiuri esentiale, wellness Romania",
  openGraph: {
    title: DEFAULT_CONFIG.metaTitle,
    description: DEFAULT_CONFIG.metaDescription,
    url: "https://olivox.ro",
    siteName: "olivox.ro",
    type: "website",
    locale: "ro_RO",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://olivox.ro",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "olivox.ro",
  url: "https://olivox.ro",
  logo: "https://olivox.ro/favicon.ico",
  description: DEFAULT_CONFIG.metaDescription,
  address: {
    "@type": "PostalAddress",
    addressCountry: "RO",
  },
  sameAs: [] as string[],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "olivox.ro",
  url: "https://olivox.ro",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://olivox.ro/cautare?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body>
        {children}
        <TrackingPixels />
        <SourceCapture />
      </body>
    </html>
  );
}
