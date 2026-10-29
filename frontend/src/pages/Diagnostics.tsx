import { useState } from "react";
import type { SetupCheck, View } from "../types";
import { apiJson } from "../api";
import { useLoad, ErrorBox, Skeleton, copyText } from "./shared";

const FIXES: { match: string; fix: string }[] = [
  {
    match: "backend deps",
    fix: "Run: cd backend, create the project venv (python3 -m venv ../.venv), activate it, then pip install -r requirements.txt.",
  },
  {
    match: "run database",
    fix: "The backend could not write its database file. Check the data_dir path exists and the disk is writable.",
  },
  {
    match: "meta api key",
    fix: "No key needed to try things out. Dev fallbacks run everything for $0. Add META_API_KEY to backend/.env for live Muse calls.",
  },
  {
    match: "baseten api key",
    fix: "Add BASETEN_API_KEY to backend/.env for live Muse Spark Open drafts, or keep dev mode for the local fallback.",
  },
  {
    match: "ffmpeg",
    fix: "Install FFmpeg (brew install ffmpeg) so uploaded audio can be converted to 16kHz mono WAV before transcription.",
  },
];

const GROUPS: { title: string; blurb: string; match: string[] }[] = [
  {
    title: "Runtime",
    blurb: "The interpreter, packages, and knobs the service starts with.",
    match: ["python", "backend deps", "environment", "critic budget"],
  },
  {
    title: "Models",
    blurb: "Credentials for live Muse calls. Missing keys fall back to free local stand-ins.",
    match: ["meta api key", "baseten api key"],
  },
  {
    title: "System",
    blurb: "Storage and media tooling the pipeline shells out to.",
    match: ["run database", "ffmpeg"],
  },
];

export default function Diagnostics({ go }: { go: (v: View) => void }) {
  const { data, error, reload } = useLoad<SetupCheck[]>("/setup/status");
  const [copied, setCopied] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [seedBusy, setSeedBusy] = useState(false);

  async function seed() {
    setSeedBusy(true);
    setSeedMsg("");
    try {
      const out = await apiJson<{ teams: number; members: number; runs: number }>("/setup/seed", "POST");
      setSeedMsg(`Seeded ${out.teams} teams, ${out.members} people, ${out.runs} runs. Explore them below.`);
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : String(e));
    }
    setSeedBusy(false);
  }

  async function reset() {
    if (!window.confirm("Reset the workspace? This deletes every team, person, and run.")) return;
    setSeedBusy(true);
    setSeedMsg("");
    try {
      const out = await apiJson<{ teams: number; members: number; runs: number }>("/setup/reset", "POST");
      setSeedMsg(`Cleared ${out.teams} teams and ${out.runs} runs. The workspace is empty.`);
    } catch (e) {
      setSeedMsg(e instanceof Error ? e.message : String(e));
    }
    setSeedBusy(false);
  }

  async function copyReport() {
    if (!data) return;
    const lines = data.map((c) => `[${c.ok ? "ok" : "FAIL"}] ${c.name}: ${c.detail}`);
    if (await copyText(lines.join("\n"))) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }

  const byName = new Map((data ?? []).map((c) => [c.name, c]));
  const failed = (data ?? []).filter((c) => !c.ok).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Diagnostics</h1>
          <p className="lede">
            One checklist for the whole system. If anything is red, the fix next to it is the whole fix.
          </p>
        </div>
        {data && (
          <button className="btn-secondary" onClick={copyReport}>
            {copied ? "Copied" : "Copy report"}
          </button>
        )}
      </div>
      <ErrorBox error={error} retry={reload} />
      {!data && !error && <Skeleton lines={8} />}

      {data && (
        <p className={`diag-verdict ${failed ? "bad" : "good"}`}>
          {failed
            ? `${failed} of ${data.length} checks failing. Work the list top to bottom.`
            : `All ${data.length} checks green. The system is ready to run.`}
        </p>
      )}

      {GROUPS.map((g) => {
        const checks = g.match
          .map((name) => byName.get(name))
          .filter((c): c is SetupCheck => Boolean(c));
        if (!checks.length) return null;
        return (
          <section key={g.title}>
            <h2>{g.title}</h2>
            <p className="muted group-blurb">{g.blurb}</p>
            <div className="card diag-group">
              {checks.map((c) => {
                const hint = FIXES.find((f) => c.name.includes(f.match));
                return (
                  <div key={c.name} className={`diag-row ${c.ok ? "ok" : "bad"}`}>
                    <span className={`dot dot-${c.ok ? "done" : "failed"}`} />
                    <div>
                      <strong>{c.name}</strong>
                      <span className="muted">{c.detail ? ` ${c.detail}` : ""}</span>
                      {!c.ok && hint && <p className="fix">Fix: {hint.fix}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <h2>Demo data</h2>
      <div className="card">
        <p className="demo-blurb">
          Fill the workspace with a believable week of history: three teams, nine people,
          six runs including a passing streak, a critic repair loop, and one failed run.
          Seeding replaces whatever is here now. Every run you start afterward lands in
          the same lists automatically.
        </p>
        <div className="demo-actions">
          <button className="btn-primary" onClick={seed} disabled={seedBusy}>
            {seedBusy ? "Working…" : "Seed demo data"}
          </button>
          <button className="btn-secondary" onClick={reset} disabled={seedBusy}>
            Reset workspace
          </button>
          <button className="btn-secondary" onClick={() => go({ name: "runs" })}>
            View runs
          </button>
        </div>
        {seedMsg && <p className="demo-msg">{seedMsg}</p>}
      </div>

      <h2>Run failed? Read it like this</h2>
      <ol className="card steps">
        <li>Open the run and read the <strong>stage timeline</strong> top to bottom. The first red entry is the failure.</li>
        <li>If <strong>checks</strong> failed, the draft itself was bad. Rerun with a clearer title.</li>
        <li>If the <strong>critic</strong> says needs_fix after 3 retries, read its violations. That is the repair list.</li>
        <li>If the timeline shows an <strong>error</strong> state, its detail names the exception. Check Diagnostics above for the matching red row.</li>
      </ol>
    </div>
  );
}
