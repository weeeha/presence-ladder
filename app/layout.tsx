import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presence ladder",
  description: "One agent, four presences. How much face does an agent need?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
