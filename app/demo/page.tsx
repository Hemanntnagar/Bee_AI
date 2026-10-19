import Link from "next/link";

const STEPS = [
  {
    title: "Open Today",
    body: "Home shows recent Bee conversations, open todos, Bee suggestions, and due cards. Live mode refreshes every 20s.",
    href: "/",
    cta: "Go to Today",
  },
  {
    title: "Find a lecture",
    body: "Use the search chip “lecture” (or “office hours”). Open CS 101 lecture — big-O and hash tables.",
    href: "/",
    cta: "Search on Today",
  },
  {
    title: "Extract → Save",
    body: "Process conversation → edit cards if needed → Save cards + commitments. Then open Review.",
    href: "/conversation/conv-103",
    cta: "Open fixture lecture",
  },
  {
    title: "Review cards",
    body: "Flip a card, grade Again / Hard / Good. SM-2 schedules the next due time.",
    href: "/review",
    cta: "Start review",
  },
  {
    title: "Close the loop",
    body: "Accept a Bee suggestion on Today, or Push to Bee from the commitment inbox. Confirm with bee todos list when live.",
    href: "/inbox",
    cta: "Open inbox",
  },
];

const RECORDING = [
  "0:00 — Title: Bee Loop · Study + Commitment Companion",
  "0:10 — Terminal: bee proxy (or say fixtures mode)",
  "0:25 — Home: conversations appear / search lecture",
  "0:50 — Process → study pack + commitment",
  "1:20 — Save → Review two cards",
  "1:40 — Push todo / Accept suggestion → Bee inbox",
  "2:00 — End card: real Bee data · localhost only · MCP/skill optional",
];

const PRIVACY = [
  "bee proxy binds to 127.0.0.1 only — never tunnel or expose publicly",
  ".bee-loop/ is gitignored (cards, commitments, processed ids)",
  "Do not commit .env, transcripts, or bee-sync exports",
  "Prefer summarizing Bee memory in demos; avoid pasting full transcripts into public chat",
  "MCP HTTP transport (if used) requires a ≥32-char bearer token on localhost",
];

export default function DemoPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <header>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Phase 4
        </p>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
          Demo guide
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Two-minute path that proves Bee Loop uses Bee (or fixtures) to create
          study cards and push commitments. Launch with{" "}
          <code className="bl-code">npm run demo</code>.
        </p>
      </header>

      <section className="bl-card p-5">
        <h2 className="bl-section-title">Walkthrough</h2>
        <ol className="space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="w-8 shrink-0 font-[family-name:var(--font-fraunces)] text-2xl text-[var(--orange)]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--text)]">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="bl-link mt-2 inline-block text-sm font-medium"
                >
                  {s.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bl-card p-5">
        <h2 className="bl-section-title">
          Screen recording shot list (~2 min)
        </h2>
        <ul className="space-y-2 font-mono text-sm text-[var(--text-muted)]">
          {RECORDING.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="bl-card p-5">
        <h2 className="bl-section-title">Privacy checklist</h2>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          {PRIVACY.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="font-bold text-[var(--green)]">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-[var(--text-muted)]">
        Reset local deck: <code className="bl-code">npm run demo:reset</code> ·
        seed cards: <code className="bl-code">npm run demo:seed</code> · live
        Bee: <code className="bl-code">npm run demo:live</code>
      </p>
    </article>
  );
}
