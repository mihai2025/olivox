import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cautare | olivox.ro",
  description: "Cauta produse Snep pe olivox.ro — suplimente alimentare, cosmetice naturale si alimente functionale.",
  alternates: { canonical: "https://olivox.ro/cautare" },
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
