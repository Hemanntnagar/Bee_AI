import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bee Loop",
  description: "Study + commitment companion powered by Bee wearable data",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <header className="border-b border-[var(--line)] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/"
            className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-[var(--accent)]"
          >
            Bee Loop
          </Link>
          <nav className="flex gap-6 text-sm text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text)]">
              Today
            </Link>
            <Link href="/review" className="hover:text-[var(--text)]">
              Review
            </Link>
            <Link href="/inbox" className="hover:text-[var(--text)]">
              Commitments
            </Link>
            <Link href="/setup" className="hover:text-[var(--text)]">
              Setup
            </Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
