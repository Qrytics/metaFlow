import { useLoad, ErrorBox, RunRow, Skeleton, useTeamsMap, PipelineStrip } from "./shared";
import type { RunSummary, TeamSummary, View } from "../types";

export default function Overview({ go }: { go: (v: View) => void }) {
  const runs = useLoad<RunSummary[]>("/runs?limit=50");
  const teams = useLoad<TeamSummary[]>("/teams");
  const teamNames = useTeamsMap();

  const list = runs.data ?? [];
  const done = list.filter((r) => r.status === "done").length;
  const needsFix = list.filter((r) => r.status === "needs_fix").length;
  const errored = list.filter((r) => r.status === "error").length;
  const people = teams.data?.reduce((n, t) => n + t.member_count, 0) ?? 0;
  const teamCount = teams.data?.length ?? 0;
  const loading = !runs.data && !runs.error;

  return (
    <div>
      <ErrorBox error={runs.error} retry={runs.reload} />
      <ErrorBox error={teams.error} retry={teams.reload} />

      {loading ? (
        <>
          <h1>Reading the run ledger</h1>
          <Skeleton lines={3} />
        </>
      ) : list.length === 0 ? (
        <>
          <h1>Nothing has run yet.</h1>
          <p className="lede">Standup audio goes in, a verified PR comes out. Start one, or fill the workspace with demo history.</p>
          <div className="empty">
            <p>No runs recorded.</p>
            <button className="btn-primary" onClick={() => go({ name: "new" })}>
              Start a run
            </button>{" "}
            <button className="btn-secondary" onClick={() => go({ name: "diag" })}>
              Seed demo data
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="verdict-line">
            {done} of {list.length} runs came out verified.
          </h1>
          <div className="proofbar" role="img" aria-label={`${done} verified, ${needsFix} need fixes, ${errored} errored`}>
            {done > 0 && <i className="m-done" style={{ flex: done }} />}
            {needsFix > 0 && <i className="m-fix" style={{ flex: needsFix }} />}
            {errored > 0 && <i className="m-err" style={{ flex: errored }} />}
          </div>
          <div className="proofbar-legend">
            <span><i className="sw sw-done" /> {done} verified</span>
            <span><i className="sw sw-failed" /> {needsFix} need fixes</span>
            <span><i className="sw sw-error" /> {errored} errored</span>
          </div>
          <p className="facts num">
            {teamCount} {teamCount === 1 ? "team" : "teams"}, {people} {people === 1 ? "person" : "people"}. Every run is replayable end to end.
          </p>
          <div className="actions">
            <button className="btn-primary" onClick={() => go({ name: "new" })}>
              New run
            </button>
          </div>
        </>
      )}

      <h2>The pipeline</h2>
      <div className="strip-wrap">
        <PipelineStrip />
      </div>

      {!loading && list.length > 0 && (
        <>
          <div className="section-head">
            <h2>Latest runs</h2>
            <button className="btn-secondary" onClick={() => go({ name: "runs" })}>
              View all
            </button>
          </div>
          <div className="card list">
            {list.slice(0, 6).map((r) => (
              <RunRow key={r.id} run={r} go={go} teamName={r.team_id ? teamNames[r.team_id] : "no team"} />
            ))}
          </div>
        </>
      )}

      <p className="muted">
        Something not responding? <button className="link-btn" onClick={() => go({ name: "diag" })}>Open Diagnostics</button> to see which part is failing and how to fix it.
      </p>
    </div>
  );
}
