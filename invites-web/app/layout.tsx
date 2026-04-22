import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import PostHogProvider from "./providers/PostHogProvider";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
});

const SITE_URL = "https://getlazzo.com";
const SITE_TITLE = "Lazzo — Plan fast. Live loud. Remember forever.";
const SITE_DESCRIPTION = "One app for the whole life of your event. Plan with polls and RSVPs, share live photos during, and get an auto-generated recap after.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: ["lazzo", "events", "party planner", "rsvp", "group chat", "shared photos", "event recap", "birthday", "house party"],
  authors: [{ name: "Lazzo" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    url: SITE_URL,
    siteName: "Lazzo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lazzo — Plan fast. Live loud. Remember forever.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#121212",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Lazzo",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "SocialNetworkingApplication",
  operatingSystem: "iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={roboto.className}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
