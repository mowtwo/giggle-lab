import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giggle Lab",
  description: "A Next.js playground for ridiculous mini web apps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-svh font-sans antialiased">{children}</body>
    </html>
  );
}
