import { useState } from "react";
import type { RunSummary, TeamSummary, View } from "../types";
import { useLoad, ErrorBox, RunRow, useTeamsMap } from "./shared";

export default function Runs({ go }: { go: (v: View) => void }) {
  const teams = useLoad<TeamSummary[]>("/teams");
  const teamNames = useTeamsMap();
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("");
  const path = `/runs?limit=100${teamId ? `&team_id=${encodeURIComponent(teamId)}` : ""}`;
  const runs = useLoad<RunSummary[]>(path);

  const list = (runs.data ?? []).filter((r) => !status || r.status === status);

  return (
    <div>
      <h1>Runs</h1>
      <p className="lede">Every pipeline execution, newest first. Click any row to replay it.</p>
      <ErrorBox error={runs.error} retry={runs.reload} />

      <div className="filters">
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">All teams</option>
          {(teams.data ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="done">done</option>
          <option value="needs_fix">needs fix</option>
          <option value="error">error</option>
          <option value="running">running</option>
        </select>
      </div>

      <div className="card list">
        {list.map((r) => (
          <RunRow key={r.id} run={r} go={go} teamName={r.team_id ? teamNames[r.team_id] ?? r.team_id : "no team"} />
        ))}
        {!list.length && <p className="muted">No runs match these filters.</p>}
      </div>
    </div>
  );
}
