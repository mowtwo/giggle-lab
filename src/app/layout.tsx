import type { Metadata } from "next";
import "animal-island-ui/style";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giggle Lab",
  description: "A tiny shelf for silly frontend apps.",
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
