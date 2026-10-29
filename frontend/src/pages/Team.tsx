import { useState } from "react";
import { apiJson, api } from "../api";
import type { TeamDetail, View } from "../types";
import { useLoad, ErrorBox, RunRow, Avatar, EmptyState, fmtTime } from "./shared";

export default function TeamPage({ id, go }: { id: string; go: (v: View) => void }) {
  const { data, error, reload } = useLoad<TeamDetail>(`/teams/${encodeURIComponent(id)}`);
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");
  const [formError, setFormError] = useState("");

  async function add() {
    if (!name.trim()) {
      setFormError("Type the person's name first.");
      return;
    }
    setFormError("");
    try {
      await apiJson(`/teams/${encodeURIComponent(id)}/members`, "POST", {
        name: name.trim(),
        role: role.trim() || "member",
      });
      setName("");
      setRole("member");
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(memberId: string) {
    try {
      await api(`/teams/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}`, {
        method: "DELETE",
      });
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  }

  if (error) {
    return (
      <div>
        <h1>Team</h1>
        <ErrorBox error={error} retry={reload} />
      </div>
    );
  }
  if (!data) return <p className="muted">Loading team…</p>;

  return (
    <div>
      <button className="link-btn back" onClick={() => go({ name: "teams" })}>
        <span aria-hidden="true">‹</span> All teams
      </button>
      <h1>{data.name}</h1>
      <p className="lede">Created {fmtTime(data.created_at)}</p>

      <h2>People ({data.members.length})</h2>
      <div className="card people">
        {data.members.map((m) => (
          <div key={m.id} className="member-row">
            <span className="member-id">
              <Avatar name={m.name} />
              <span>
                <strong>{m.name}</strong>
                <span className="muted"> · {m.role}</span>
              </span>
            </span>
            <button className="btn-danger-ghost" onClick={() => remove(m.id)}>
              Remove
            </button>
          </div>
        ))}
        {!data.members.length && (
          <p className="muted">Nobody here yet. Add the first person below.</p>
        )}
        <div className="inline-form form member-add">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Person's name" onKeyDown={(e) => e.key === "Enter" && add()} />
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
          <button className="btn-primary" onClick={add}>
            Add person
          </button>
        </div>
        {formError && <p className="form-error">{formError}</p>}
      </div>

      <h2>Recent runs</h2>
      {data.recent_runs.length ? (
        <div className="card list">
          {data.recent_runs.map((r) => (
            <RunRow key={r.id} run={r} go={go} teamName={data.name} />
          ))}
        </div>
      ) : (
        <EmptyState text="No runs filed under this team yet." />
      )}
      <button className="btn-secondary" onClick={() => go({ name: "new" })}>
        Start a run for this team
      </button>
    </div>
  );
}
