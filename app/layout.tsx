import type { Metadata, Viewport } from "next";
import InstallApp from "./install-app";
import "./globals.css";
import "./night-match.css";

export const metadata: Metadata = {
  title: "Laro FC — Hyung’s career",
  description: "A football career simulator with Tagalog quizzes.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Laro FC", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080f1b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<InstallApp /></body>
    </html>
  );
}
