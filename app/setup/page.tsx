import { SetupHealth } from "@/components/SetupHealth";

export default function SetupPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--green)]">
        Connect Bee
      </h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">
        Bee Loop reads your wearable conversations through the local Bee CLI
        proxy. Keep the proxy on localhost only — never expose it.
      </p>

      <SetupHealth />

      <ol className="mt-8 list-inside list-decimal space-y-6 text-[var(--text-muted)]">
        <li>
          Install the Bee iOS (or Watch) app and enable{" "}
          <strong className="text-[var(--text)]">Developer Mode</strong> (tap
          the app version in Settings).
        </li>
        <li>
          Install CLI: <code className="bl-code">npm install -g @beeai/cli</code>
        </li>
        <li>
          Login: <code className="bl-code">bee login --no-wait</code> → open the
          link → approve → <code className="bl-code">bee status</code>
        </li>
        <li>
          Smoke test: <code className="bl-code">bee me</code>,{" "}
          <code className="bl-code">bee now --json</code>
        </li>
        <li>
          Start proxy (keep running): <code className="bl-code">bee proxy</code>{" "}
          on <code className="bl-code">127.0.0.1:8787</code>
        </li>
        <li>
          Run Bee Loop: <code className="bl-code">npm run demo</code> (fixtures)
          or <code className="bl-code">npm run demo:live</code>
        </li>
        <li>
          Capture a short study conversation + a verbal commitment on Bee, then
          process it from Today.
        </li>
      </ol>

      <section className="bl-card mt-12 p-5">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--green)]">
          Agents (MCP + Skill)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
          Connect Cursor / Claude / Codex to Bee memory, then use the Bee Loop
          project skill for study cards and commitment push-back.
        </p>
        <ol className="mt-6 list-inside list-decimal space-y-4 text-sm text-[var(--text-muted)]">
          <li>
            Upstream Bee skill:{" "}
            <code className="bl-code">
              npx skills add bee-computer/bee-skill
            </code>
          </li>
          <li>
            MCP one-command connect (after{" "}
            <code className="bl-code">bee login</code>):
            <pre className="bl-pre mt-2">{`bee mcp connect claude-code   # Cursor / Claude Code
bee mcp connect claude        # Claude Desktop
bee mcp connect codex
bee mcp status`}</pre>
          </li>
          <li>
            This repo ships{" "}
            <code className="bl-code">.cursor/skills/bee-loop/</code> — ask the
            agent to process a lecture, list due cards, or push a todo.
          </li>
          <li>
            Agent CLI helpers (app must be running):
            <pre className="bl-pre mt-2">{`npm run agent:status
npm run agent:process -- --latest --save
npm run agent:due
npm run agent:push-todo -- "Email TA my outline"`}</pre>
          </li>
        </ol>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Docs:{" "}
          <a
            className="bl-link font-medium"
            href="https://docs.bee.computer/docs/mcp"
            target="_blank"
            rel="noreferrer"
          >
            Bee MCP
          </a>
          {" · "}
          <a
            className="bl-link font-medium"
            href="https://github.com/bee-computer/bee-skill"
            target="_blank"
            rel="noreferrer"
          >
            bee-skill
          </a>
        </p>
      </section>

      <p className="mt-8 text-sm text-[var(--text-muted)]">
        Guided checklist: <code className="bl-code">npm run setup:bee</code>
        <br />
        Offline UI: <code className="bl-code">npm run demo</code>
      </p>
    </article>
  );
}
