import "./globals.css";
import NavBar from "@/components/NavBar";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "PocketGPT",
  description: "Compact voice AI device by PocketGPT.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07090d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
