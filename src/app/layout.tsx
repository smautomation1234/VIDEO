import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelForge · Gemini Omni Flash",
  description: "Approval-gated Gemini Omni Flash Reel generation with selectable takes and browser editing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
