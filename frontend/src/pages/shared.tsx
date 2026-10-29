import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api";
import type { RunSummary, TeamSummary, View } from "../types";

export function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill st-${status}`}>{status.replace("_", " ")}</span>;
}

export function useLoad<T>(path: string | null): { data: T | null; error: string; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    api<T>(path)
      .then((d) => live && (setData(d), setError("")))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [path, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}

export function ErrorBox({ error, retry }: { error: string; retry?: () => void }) {
  if (!error) return null;
  return (
    <div className="error-box">
      <strong>Something failed to load.</strong> {error}{" "}
      {retry && (
        <button className="link-btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function RunRow({ run, go, teamName }: { run: RunSummary; go: (v: View) => void; teamName?: string }) {
  return (
    <button className="run-row" onClick={() => go({ name: "run", id: run.id })}>
      <span className={`dot dot-${run.status === "needs_fix" ? "failed" : run.status}`} />
      <span className="run-title">{run.title}</span>
      <span className="run-meta">
        {teamName ?? run.team_id ?? "no team"} · {run.mode} · {fmtTime(run.created_at)}
      </span>
      <StatusPill status={run.status} />
      <span className="chev" aria-hidden="true">›</span>
    </button>
  );
}

const AVATAR_COLORS = ["av-blue", "av-teal", "av-green", "av-amber", "av-rose", "av-slate"];

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return <span className={`avatar ${AVATAR_COLORS[hash % AVATAR_COLORS.length]}`}>{initials || "?"}</span>;
}

export function DiffView({ diff }: { diff: string }) {
  if (!diff.trim()) return <p className="muted">Empty diff. Nothing changed.</p>;
  return (
    <pre className="diff">
      {diff.split("\n").map((line, i) => {
        const cls = line.startsWith("+") && !line.startsWith("+++") ? "dl-add" : line.startsWith("-") && !line.startsWith("---") ? "dl-del" : line.startsWith("@@") ? "dl-hunk" : "dl-ctx";
        return (
          <span key={i} className={cls}>
            {line || " "}
            {"\n"}
          </span>
        );
      })}
    </pre>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="muted">{text}</p>
      {action}
    </div>
  );
}

export function useTeamsMap(): Record<string, string> {
  const { data } = useLoad<TeamSummary[]>("/teams");
  const map: Record<string, string> = {};
  for (const t of data ?? []) map[t.id] = t.name;
  return map;
}
