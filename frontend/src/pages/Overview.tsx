import { useLoad, ErrorBox, RunRow, useTeamsMap } from "./shared";
import { api } from "../api";
import type { RunSummary, TeamSummary, View } from "../types";

export default function Overview({ go }: { go: (v: View) => void }) {
  const runs = useLoad<RunSummary[]>("/runs?limit=50");
  const teams = useLoad<TeamSummary[]>("/teams");
  const teamNames = useTeamsMap();

  const list = runs.data ?? [];
  const done = list.filter((r) => r.status === "done").length;
  const passRate = list.length ? Math.round((done / list.length) * 100) : 0;

  return (
    <div>
      <h1>Overview</h1>
      <p className="lede">Standup audio in, verified PR out. Every run below is replayable end to end.</p>
      <ErrorBox error={runs.error} retry={runs.reload} />
      <ErrorBox error={teams.error} retry={teams.reload} />

      <div className="stat-grid">
        <div className="card stat">
          <span className="stat-num">{list.length}</span>
          <span className="stat-label">runs recorded</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{passRate}%</span>
          <span className="stat-label">passing runs</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{teams.data?.length ?? 0}</span>
          <span className="stat-label">teams</span>
        </div>
        <div className="card stat">
          <span className="stat-num">{teams.data?.reduce((n, t) => n + t.member_count, 0) ?? 0}</span>
          <span className="stat-label">people across teams</span>
        </div>
      </div>

      <div className="section-head">
        <h2>Latest runs</h2>
        <button className="btn-secondary" onClick={() => go({ name: "runs" })}>
          View all
        </button>
      </div>
      <div className="card list">
        {list.slice(0, 8).map((r) => (
          <RunRow key={r.id} run={r} go={go} teamName={r.team_id ? teamNames[r.team_id] : "no team"} />
        ))}
        {!list.length && <p className="muted">No runs yet. Create one from New run.</p>}
      </div>

      <h2>How a run works</h2>
      <ol className="card steps">
        <li><span className="step-key">Transcribe</span>Standup audio becomes speaker-attributed turns.</li>
        <li><span className="step-key">Draft</span>Muse Spark Open writes the smallest diff plus tests.</li>
        <li><span className="step-key">Checks</span>Deterministic pre-checks run before any critic call.</li>
        <li><span className="step-key">Critic</span>Muse Wonder repairs violations, max 3 retries.</li>
        <li><span className="step-key">Diagram</span>Muse Image renders the change diagram.</li>
      </ol>
      <p className="muted">API not responding? Open <button className="link-btn" onClick={() => go({ name: "diag" })}>Diagnostics</button>. It names the exact failing part and how to fix it.</p>
    </div>
  );
}

export async function quickHealth(): Promise<boolean> {
  try {
    await api<{ ok: boolean }>("/health");
    return true;
  } catch {
    return false;
  }
}
