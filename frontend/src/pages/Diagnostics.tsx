import type { SetupCheck } from "../types";
import { useLoad, ErrorBox } from "./shared";

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

export default function Diagnostics() {
  const { data, error, reload } = useLoad<SetupCheck[]>("/setup/status");

  return (
    <div>
      <h1>Diagnostics</h1>
      <p className="lede">
        One checklist for the whole system. If anything is red, the fix next to it is the whole fix.
      </p>
      <ErrorBox error={error} retry={reload} />
      {!data && !error && <p className="muted">Running checks…</p>}

      <div className="card">
        {(data ?? []).map((c) => {
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
