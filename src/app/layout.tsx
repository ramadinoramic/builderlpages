import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LP Builder - A/B Testing Platform",
  description: "Landing page builder and A/B testing platform for affiliate marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
