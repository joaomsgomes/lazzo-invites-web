import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  display: 'swap',
});
// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: "Lazzo - Connect with your tribe",
  description: "Plan events, create memories, and stay connected with your friends and groups.",
  keywords: ["lazzo", "events", "groups", "social", "friends", "memories"],
  authors: [{ name: "Lazzo Team" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Lazzo - Connect with your tribe",
    description: "Plan events, create memories, and stay connected with your friends and groups.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={roboto.className}>
        {children}
      </body>
    </html>
  );
}
