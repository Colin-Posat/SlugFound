import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// "Lost & Found Bulletin" type system:
//   Fraunces      — editorial display (headings, logo, hero)
//   Hanken Grotesk — body / UI text
//   JetBrains Mono — filing-card meta (locations, timestamps, IDs)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SlugFound — UCSC Lost & Found",
  description: "The official lost and found platform for UC Santa Cruz students.",
};

// Runs before paint to apply the saved theme (or OS preference) so there's no
// flash of the wrong theme. Kept tiny and dependency-free on purpose.
const themeInitScript = `(function(){try{var t=localStorage.getItem('slugfound-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${hanken.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/* Apply theme class before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        {/* Global toast container — colors use theme tokens so toasts follow
            light/dark automatically. */}
        <Toaster
          theme="system"
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-line)",
              color: "var(--color-ink)",
            },
          }}
        />
      </body>
    </html>
  );
}
