import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laro FC — Chris’s career",
  description: "A football career wheel with Tagalog rounds. Made for Chris by Shelomi.",
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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
