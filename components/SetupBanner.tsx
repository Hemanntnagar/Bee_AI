"use client";

import Link from "next/link";
import { useState } from "react";

export function SetupBanner({ message }: { message?: string }) {
  const [checking, setChecking] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function recheck() {
    setChecking(true);
    setLiveError(null);
    setOk(false);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.ok) {
        setOk(true);
        window.location.reload();
        return;
      }
      setLiveError(data.error ?? "Still unreachable");
    } catch (e) {
      setLiveError(e instanceof Error ? e.message : "Health check failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="bl-card mb-8 border-[var(--orange)]/30 p-5 shadow-[var(--shadow)]">
      <p className="font-semibold text-[var(--orange)]">
        Bee proxy not connected
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        {message ??
          "Bee Loop needs the local Bee API bridge. Authenticate the CLI, start the proxy, then retry — or use fixtures mode."}
      </p>
      <ol className="mt-4 list-inside list-decimal space-y-1.5 font-mono text-xs text-[var(--text-muted)]">
        <li>bee login</li>
        <li>bee status</li>
        <li>bee proxy</li>
        <li>npm run demo</li>
      </ol>
      {(liveError || ok) && (
        <p
          className={`mt-3 text-xs font-medium ${
            ok ? "text-[var(--green)]" : "text-[var(--orange-dark)]"
          }`}
        >
          {ok ? "Connected — reloading…" : liveError}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recheck}
          disabled={checking}
          className="bl-btn bl-btn-primary"
        >
          {checking ? "Checking…" : "Retry connection"}
        </button>
        <Link href="/setup" className="bl-link text-sm font-medium">
          Full setup guide
        </Link>
        <span className="text-xs text-[var(--text-muted)]">
          or <code className="bl-code">npm run demo</code>
        </span>
      </div>
    </div>
  );
}
