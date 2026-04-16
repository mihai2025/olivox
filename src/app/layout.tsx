import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import TrackingPixels from "@/components/TrackingPixels";
import SourceCapture from "@/components/SourceCapture";
import ConsentBanner from "@/components/ConsentBanner";
import AnalyticsLoader from "@/components/AnalyticsLoader";
import AnnouncementBar from "@/components/AnnouncementBar";
import FloatingContact from "@/components/FloatingContact";
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
  metadataBase: new URL("https://olivox.ro"),
  openGraph: {
    title: DEFAULT_CONFIG.metaTitle,
    description: DEFAULT_CONFIG.metaDescription,
    url: "https://olivox.ro",
    siteName: "olivox.ro",
    type: "website",
    locale: "ro_RO",
    images: [
      {
        url: "https://olivox.ro/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "olivox.ro — Suplimente alimentare si cosmetice naturale Snep",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_CONFIG.metaTitle,
    description: DEFAULT_CONFIG.metaDescription,
    images: ["https://olivox.ro/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
        <link rel="preconnect" href="https://media.ghidulfunerar.ro" crossOrigin="" />
        <link rel="dns-prefetch" href="https://media.ghidulfunerar.ro" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Sari la continut</a>
        <AnnouncementBar />
        <main id="main">{children}</main>
        <FloatingContact />
        <ConsentBanner />
        <Suspense fallback={null}>
          <AnalyticsLoader />
        </Suspense>
        <TrackingPixels />
        <SourceCapture />
      </body>
    </html>
  );
}
