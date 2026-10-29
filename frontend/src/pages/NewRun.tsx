import { useState } from "react";
import { apiForm } from "../api";
import type { TeamSummary, View } from "../types";
import { useLoad, ErrorBox, Menu } from "./shared";

export default function NewRun({ go }: { go: (v: View) => void }) {
  const teams = useLoad<TeamSummary[]>("/teams");
  const [title, setTitle] = useState("");
  const [teamId, setTeamId] = useState("");
  const [mode, setMode] = useState<"audio" | "pr_url">("audio");
  const [file, setFile] = useState<File | null>(null);
  const [prUrl, setPrUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("Give the run a title so the team can find it later.");
      return;
    }
    if (mode === "audio" && !file) {
      setError("Attach a standup audio file, or switch to PR URL mode.");
      return;
    }
    if (mode === "pr_url" && !prUrl.trim()) {
      setError("Paste a PR URL, or switch to audio mode.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("mode", mode);
      form.append("pr_url", prUrl.trim());
      form.append("team_id", teamId);
      if (file) form.append("file", file);
      const out = await apiForm<{ run_id: string }>("/pipeline/run", form);
      go({ name: "run", id: out.run_id });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>New run</h1>
      <p className="lede">Takes about ten seconds in dev mode. The full event log is saved automatically.</p>
      <ErrorBox error={teams.error} retry={teams.reload} />

      <div className="card form">
        <label>
          Run title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Login retry fix from Tuesday standup" />
        </label>
        <span className="field-label">Team (optional)</span>
        <div className="field-menu">
          <Menu
            label="File this run under a team"
            value={teamId}
            onChange={setTeamId}
            options={[
              { value: "", label: "No team (personal run)" },
              ...(teams.data ?? []).map((t) => ({
                value: t.id,
                label: t.name,
                hint: `${t.member_count} ${t.member_count === 1 ? "person" : "people"}`,
              })),
            ]}
          />
        </div>
        <div className="mode-toggle">
          <button className={mode === "audio" ? "active" : ""} onClick={() => setMode("audio")}>
            Standup audio
          </button>
          <button className={mode === "pr_url" ? "active" : ""} onClick={() => setMode("pr_url")}>
            PR URL
          </button>
        </div>
        {mode === "audio" ? (
          <label
            className={`dropzone${dragOver ? " over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
          >
            <span className="dropzone-title">Drop standup audio here, or click to browse</span>
            <span className="dropzone-sub">mp3, wav, m4a or ogg. Converted to 16kHz mono before transcription.</span>
            {file && <span className="dropzone-name">{file.name}</span>}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : (
          <label>
            PR URL
            <input value={prUrl} onChange={(e) => setPrUrl(e.target.value)} placeholder="https://…" />
          </label>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Running pipeline…" : "Run pipeline"}
        </button>
        {busy && <p className="muted">Working through transcribe → draft → checks → critic → diagram. This page moves on its own when done.</p>}
      </div>
    </div>
  );
}
