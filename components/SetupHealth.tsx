"use client";

import { useCallback, useEffect, useState } from "react";

type Health = {
  ok: boolean;
  mock: boolean;
  user?: { name?: string; email?: string };
  error?: string;
};

export function SetupHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = (await res.json()) as Health;
      setHealth(data);
    } catch (e) {
      setHealth({
        ok: false,
        mock: false,
        error: e instanceof Error ? e.message : "Check failed",
      });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const statusColor = !health
    ? "text-[var(--text-muted)]"
    : health.ok
      ? "text-[var(--green)]"
      : "text-[var(--orange)]";

  return (
    <div className="bl-card mt-8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Live connection
        </h2>
        <button
          type="button"
          onClick={check}
          disabled={checking}
          className="bl-link text-xs font-medium disabled:opacity-50"
        >
          {checking ? "Checking…" : "Refresh"}
        </button>
      </div>
      <p className={`mt-3 text-sm font-medium ${statusColor}`}>
        {checking && !health
          ? "Checking Bee proxy…"
          : health?.ok
            ? health.mock
              ? "Fixtures mode (BEE_MOCK=1) — UI works without Bee."
              : `Connected${health.user?.name ? ` as ${health.user.name}` : ""}${
                  health.user?.email ? ` · ${health.user.email}` : ""
                }`
            : (health?.error ?? "Not connected")}
      </p>
      {!health?.ok && !checking && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          In another terminal: <code className="bl-code">bee proxy</code>{" "}
          (default <code className="bl-code">127.0.0.1:8787</code>)
        </p>
      )}
    </div>
  );
}
