import { useState } from "react";
import type { RunSummary, TeamSummary, View } from "../types";
import { useLoad, ErrorBox, RunRow, Menu, Skeleton, useTeamsMap } from "./shared";

const STATUSES = ["", "done", "needs_fix", "error", "running"] as const;
const STATUS_LABEL: Record<string, string> = {
  "": "All",
  done: "Passing",
  needs_fix: "Need fixes",
  error: "Errored",
  running: "Running",
};

export default function Runs({ go }: { go: (v: View) => void }) {
  const teams = useLoad<TeamSummary[]>("/teams");
  const teamNames = useTeamsMap();
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState<string>("");
  const [query, setQuery] = useState("");
  const path = `/runs?limit=100${teamId ? `&team_id=${encodeURIComponent(teamId)}` : ""}`;
  const runs = useLoad<RunSummary[]>(path);

  const all = runs.data ?? [];
  const q = query.trim().toLowerCase();
  const list = all.filter(
    (r) =>
      (!status || r.status === status) &&
      (!q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)),
  );

  return (
    <div>
      <h1>Runs</h1>
      <p className="lede">Every pipeline execution, newest first. Click a row to replay it.</p>
      <ErrorBox error={runs.error} retry={runs.reload} />

      <div className="card toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or run ID"
          aria-label="Search runs"
        />
        <Menu
          label="Filter by team"
          value={teamId}
          onChange={setTeamId}
          options={[
            { value: "", label: "All teams" },
            ...(teams.data ?? []).map((t) => ({
              value: t.id,
              label: t.name,
              hint: `${t.member_count}`,
            })),
          ]}
        />
      </div>

      <div className="chips">
        {STATUSES.map((s) => {
          const n = s ? all.filter((r) => r.status === s).length : all.length;
          return (
            <button
              key={s}
              className={`chip${status === s ? " on" : ""}`}
              onClick={() => setStatus(s)}
            >
              {STATUS_LABEL[s]} <span className="num">{n}</span>
            </button>
          );
        })}
      </div>

      {!runs.data && !runs.error ? (
        <Skeleton lines={6} />
      ) : (
        <>
          <p className="muted result-count">
            Showing {list.length} of {all.length} {all.length === 1 ? "run" : "runs"}
          </p>
          <div className="card list">
            {list.map((r) => (
              <RunRow key={r.id} run={r} go={go} teamName={r.team_id ? teamNames[r.team_id] ?? r.team_id : "no team"} />
            ))}
            {!list.length && <p className="muted list-empty">No runs match these filters.</p>}
          </div>
        </>
      )}
    </div>
  );
}
