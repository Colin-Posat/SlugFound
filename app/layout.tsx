import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SlugFound — UCSC Lost & Found",
  description: "The official lost and found platform for UC Santa Cruz students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        {children}
        {/* Global toast container — used app-wide for success/error notifications.
            Mounted at the root so toasts appear on every page including auth. */}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgb(24 24 27)", // zinc-900
              border: "1px solid rgb(39 39 42)", // zinc-800
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
