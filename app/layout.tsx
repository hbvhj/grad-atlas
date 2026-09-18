import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grad Atlas · Graduate Applications",
  description: "Graduate programs, application deadlines and test preparation",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
