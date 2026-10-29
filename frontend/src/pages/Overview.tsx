import { useLoad, ErrorBox, RunRow, Skeleton, useTeamsMap } from "./shared";
import { api } from "../api";
import type { RunSummary, TeamSummary, View } from "../types";

export default function Overview({ go }: { go: (v: View) => void }) {
  const runs = useLoad<RunSummary[]>("/runs?limit=50");
  const teams = useLoad<TeamSummary[]>("/teams");
  const teamNames = useTeamsMap();

  const list = runs.data ?? [];
  const done = list.filter((r) => r.status === "done").length;
  const needsFix = list.filter((r) => r.status === "needs_fix").length;
  const errored = list.filter((r) => r.status === "error").length;
  const passRate = list.length ? Math.round((done / list.length) * 100) : 0;
  const people = teams.data?.reduce((n, t) => n + t.member_count, 0) ?? 0;
  const loading = !runs.data && !runs.error;

  return (
    <div>
      <h1>Overview</h1>
      <p className="lede">Standup audio in, verified PR out. Every run below is replayable end to end.</p>
      <ErrorBox error={runs.error} retry={runs.reload} />
      <ErrorBox error={teams.error} retry={teams.reload} />

      {loading ? (
        <Skeleton lines={4} />
      ) : (
        <div className="card strip">
          <div className="strip-cell">
            <span className="strip-val num">{list.length}</span>
            <span className="strip-label">runs recorded</span>
            <span className="strip-sub">newest first below</span>
          </div>
          <div className="strip-cell">
            <span className="strip-val num">{passRate}%</span>
            <span className="strip-label">passing</span>
            <span className="strip-sub">{done} of {list.length} verified clean</span>
          </div>
          <div className="strip-cell">
            <span className="strip-val num">{teams.data?.length ?? 0}</span>
            <span className="strip-label">teams</span>
            <span className="strip-sub">filing runs together</span>
          </div>
          <div className="strip-cell">
            <span className="strip-val num">{people}</span>
            <span className="strip-label">people</span>
            <span className="strip-sub">across all teams</span>
          </div>
        </div>
      )}
      {!loading && list.length > 0 && (
        <div className="card meter-card">
          <div className="meter" aria-label={`${passRate}% of runs passing`}>
            {done > 0 && <i className="m-done" style={{ width: `${(done / list.length) * 100}%` }} />}
            {needsFix > 0 && <i className="m-fix" style={{ width: `${(needsFix / list.length) * 100}%` }} />}
            {errored > 0 && <i className="m-err" style={{ width: `${(errored / list.length) * 100}%` }} />}
          </div>
          <div className="meter-legend muted">
            <span><i className="dot dot-done" /> {done} passing</span>
            <span><i className="dot dot-failed" /> {needsFix} need fixes</span>
            <span><i className="dot dot-error" /> {errored} errored</span>
          </div>
        </div>
      )}

      <div className="section-head">
        <h2>Latest runs</h2>
        <button className="btn-secondary" onClick={() => go({ name: "runs" })}>
          View all
        </button>
      </div>
      {loading ? (
        <Skeleton lines={5} />
      ) : (
        <div className="card list">
          {list.slice(0, 8).map((r) => (
            <RunRow key={r.id} run={r} go={go} teamName={r.team_id ? teamNames[r.team_id] : "no team"} />
          ))}
          {!list.length && <p className="muted list-empty">No runs yet. Start one from New run and it lands here.</p>}
        </div>
      )}

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
