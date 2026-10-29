import { useState } from "react";
import { apiJson } from "../api";
import type { TeamSummary, View } from "../types";
import { useLoad, ErrorBox, EmptyState, Avatar, Chevron, Skeleton } from "./shared";

export default function Teams({ go }: { go: (v: View) => void }) {
  const { data, error, reload } = useLoad<TeamSummary[]>("/teams");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  async function create() {
    if (!name.trim()) {
      setFormError("Name the team first. Try Payments, Mobile, or Growth.");
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const t = await apiJson<TeamSummary>("/teams", "POST", { name: name.trim() });
      setName("");
      reload();
      go({ name: "team", id: t.id });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Teams</h1>
          <p className="lede">Groups of people working on the same project. Runs can be filed under a team.</p>
        </div>
      </div>
      <ErrorBox error={error} retry={reload} />

      <div className="card form inline-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New team name" onKeyDown={(e) => e.key === "Enter" && create()} />
        <button className="btn-primary" onClick={create} disabled={busy}>
          {busy ? "Creating…" : "Create team"}
        </button>
      </div>
      {formError && <p className="form-error">{formError}</p>}

      {!data && !error ? (
        <Skeleton lines={3} />
      ) : !data?.length ? (
        <EmptyState
          text="No teams yet. Create the first one above and invite the people on your project."
        />
      ) : (
        <div className="team-grid">
          {data.map((t) => (
            <button key={t.id} className="card team-card" onClick={() => go({ name: "team", id: t.id })}>
              <span className="team-card-top">
                <Avatar name={t.name} />
                <span className="team-card-name">{t.name}</span>
              </span>
              <span className="team-card-people">
                <span className="avatar-stack">
                  {t.sample_members.map((m) => (
                    <Avatar key={m} name={m} size="sm" />
                  ))}
                </span>
                <span className="muted">
                  {t.member_count} {t.member_count === 1 ? "person" : "people"}
                </span>
                <Chevron />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
