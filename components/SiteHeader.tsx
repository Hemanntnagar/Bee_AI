"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/review", label: "Review" },
  { href: "/inbox", label: "Commitments" },
  { href: "/demo", label: "Demo" },
  { href: "/setup", label: "Setup" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function closeMenu() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  // Close after client navigations
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--cream)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight text-[var(--green)] sm:text-2xl"
          onClick={closeMenu}
        >
          Bee Loop
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors ${
                isActive(l.href)
                  ? "bg-[var(--green-soft)] font-medium text-[var(--green)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--green-soft)]/60 hover:text-[var(--text)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Native details/summary — works even if client JS is slow/unavailable */}
        <details ref={detailsRef} className="relative md:hidden">
          <summary
            className="flex cursor-pointer list-none items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--green)] [&::-webkit-details-marker]:hidden"
            aria-label="Toggle menu"
          >
            <span className="flex w-4 flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-full bg-[var(--green)]" />
              <span className="block h-0.5 w-full bg-[var(--green)]" />
              <span className="block h-0.5 w-full bg-[var(--green)]" />
            </span>
            Menu
          </summary>
          <nav
            className="absolute right-0 mt-2 w-56 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-mid)] p-2 shadow-[var(--shadow)]"
            aria-label="Mobile"
          >
            <ul className="flex flex-col gap-0.5">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={closeMenu}
                    className={`block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm ${
                      isActive(l.href)
                        ? "bg-[var(--green-soft)] font-medium text-[var(--green)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </header>
  );
}
