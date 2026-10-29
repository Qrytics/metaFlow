import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api";
import type { RunSummary, TeamSummary, View } from "../types";

export function fmtTime(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export function relTime(ts: number): string {
  const s = Math.max(0, Date.now() / 1000 - ts);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtTime(ts).split(",")[0];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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

export function Chevron({ dir = "right" }: { dir?: "right" | "left" }) {
  return (
    <svg
      className={`chev-svg chev-${dir}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      {dir === "right" ? (
        <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card skel" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skel-bar" style={{ width: `${92 - i * 17}%` }} />
      ))}
    </div>
  );
}

export function RunRow({ run, go, teamName }: { run: RunSummary; go: (v: View) => void; teamName?: string }) {
  return (
    <button className="run-row" onClick={() => go({ name: "run", id: run.id })}>
      <span className={`dot dot-${run.status === "needs_fix" ? "failed" : run.status}`} />
      <span className="run-id num" title={run.id}>{run.id.replace("run_", "").slice(0, 8)}</span>
      <span className="run-title">{run.title}</span>
      <span className="run-meta" title={fmtTime(run.created_at)}>
        {teamName ?? run.team_id ?? "no team"} · {run.mode} · {relTime(run.created_at)}
      </span>
      <StatusPill status={run.status} />
      <Chevron />
    </button>
  );
}

const AVATAR_COLORS = ["av-blue", "av-teal", "av-green", "av-amber", "av-rose", "av-slate"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className={`avatar av-${size} ${AVATAR_COLORS[hash % AVATAR_COLORS.length]}`}>
      {initials || "?"}
    </span>
  );
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

export interface MenuOption {
  value: string;
  label: string;
  hint?: string;
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={`check-svg ${className}`} width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Menu({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: MenuOption[];
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[currentIndex] ?? { value: "", label: "" };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function openMenu() {
    setActive(currentIndex);
    setOpen(true);
  }

  function onButtonKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) {
        onChange(options[active]?.value ?? value);
        setOpen(false);
      } else {
        openMenu();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openMenu();
    }
  }

  function onOptionKey(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(options[i].value);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={`menu${open ? " open" : ""}`}>
      <button
        type="button"
        className="menu-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKey}
      >
        <span className="menu-current">{current.label}</span>
        <Chevron />
      </button>
      {open && (
        <ul className="menu-pop" role="listbox" aria-label={label}>
          {options.map((o, i) => (
            <li key={o.value + o.label} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                className={`menu-opt${i === active ? " hot" : ""}${o.value === value ? " sel" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setActive(i)}
                onKeyDown={(e) => onOptionKey(e, i)}
              >
                <span className="menu-check">{o.value === value && <Check />}</span>
                <span className="menu-opt-label">{o.label}</span>
                {o.hint && <span className="menu-hint num">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
