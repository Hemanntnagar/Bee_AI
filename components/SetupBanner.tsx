"use client";

import Link from "next/link";

export function SetupBanner({ message }: { message?: string }) {
  return (
    <div className="mb-8 rounded-lg border border-[var(--line)] bg-[var(--bg-mid)]/80 px-5 py-4 text-sm">
      <p className="text-[var(--text-muted)]">
        {message ??
          "Bee proxy not reachable. Run bee login and bee proxy, or use BEE_MOCK=1."}
      </p>
      <Link
        href="/setup"
        className="mt-2 inline-block text-[var(--accent)] underline-offset-2 hover:underline"
      >
        Setup instructions
      </Link>
    </div>
  );
}
