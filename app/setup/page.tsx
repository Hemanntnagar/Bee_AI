export default function SetupPage() {
  return (
    <article className="max-w-2xl prose prose-invert">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--accent)]">
        Connect Bee
      </h1>
      <ol className="mt-8 space-y-6 text-[var(--text-muted)] list-decimal list-inside">
        <li>Install the Bee iOS app and enable Developer Mode (tap app version).</li>
        <li>
          Install CLI:{" "}
          <code className="text-[var(--text)]">npm install -g @beeai/cli</code>
        </li>
        <li>
          Login:{" "}
          <code className="text-[var(--text)]">bee login --no-wait</code> → open link →{" "}
          <code className="text-[var(--text)]">bee status</code>
        </li>
        <li>
          Smoke test:{" "}
          <code className="text-[var(--text)]">bee me</code>,{" "}
          <code className="text-[var(--text)]">bee now --json</code>
        </li>
        <li>
          Start proxy (keep running):{" "}
          <code className="text-[var(--text)]">bee proxy</code> on{" "}
          <code className="text-[var(--text)]">127.0.0.1:8787</code>
        </li>
        <li>
          Run Bee Loop:{" "}
          <code className="text-[var(--text)]">npm run dev</code>
        </li>
      </ol>
      <p className="mt-8 text-sm">
        Or run <code className="text-[var(--text)]">npm run setup:bee</code> for a guided checklist.
        For offline UI: <code className="text-[var(--text)]">BEE_MOCK=1 npm run dev</code>.
      </p>
    </article>
  );
}
