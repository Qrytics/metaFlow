import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { View } from "./types";
import Overview from "./pages/Overview";
import NewRun from "./pages/NewRun";
import Runs from "./pages/Runs";
import RunDetailPage from "./pages/RunDetail";
import Teams from "./pages/Teams";
import TeamPage from "./pages/Team";
import Diagnostics from "./pages/Diagnostics";

const NAV: { key: View["name"]; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "new", label: "New run" },
  { key: "runs", label: "Runs" },
  { key: "teams", label: "Teams" },
  { key: "diag", label: "Diagnostics" },
];

function Splash() {
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      const raw = localStorage.getItem("metaflow.prefs");
      if (raw && JSON.parse(raw).calm) calm = true;
    } catch {
      /* defaults stand */
    }
    if (calm) {
      setGone(true);
      return;
    }
    const raf = window.requestAnimationFrame(() => setStarted(true));
    const t1 = window.setTimeout(() => setLeaving(true), 500);
    const t2 = window.setTimeout(() => setGone(true), 780);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`splash${started ? " play" : ""}${leaving ? " leaving" : ""}`} aria-hidden="true">
      <div className="splash-inner">
        <span className="splash-mark">
          <i />
          <i />
          <i />
        </span>
        <span className="splash-name">
          <strong>meta</strong>Flow
        </span>
        <span className="splash-tag">standups in, verified PRs out</span>
        <span className="splash-bar">
          <i />
        </span>
      </div>
    </div>
  );
}

const FAKE_USER = { name: "Demo Operator", email: "operator@metaflow.local" };

interface Prefs {
  compact: boolean;
  calm: boolean;
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem("metaflow.prefs");
    if (raw) return { compact: false, calm: false, ...JSON.parse(raw) };
  } catch {
    /* fresh defaults */
  }
  return { compact: false, calm: false };
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      return localStorage.getItem("metaflow.signedOut") ? null : FAKE_USER;
    } catch {
      return FAKE_USER;
    }
  });
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("metaflow.prefs", JSON.stringify(prefs));
    } catch {
      /* private mode: prefs last for the session only */
    }
    document.body.classList.toggle("compact", prefs.compact);
    document.body.classList.toggle("calm", prefs.calm);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSettings(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSettings(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function signOut() {
    try {
      localStorage.setItem("metaflow.signedOut", "1");
    } catch {
      /* session-only */
    }
    setUser(null);
    setOpen(false);
    setSettings(false);
  }

  function signIn() {
    try {
      localStorage.removeItem("metaflow.signedOut");
    } catch {
      /* session-only */
    }
    setUser(FAKE_USER);
  }

  if (!user) {
    return (
      <button type="button" className="btn-primary btn-signin" onClick={signIn}>
        Sign in
      </button>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="profile">
      <button
        type="button"
        className="profile-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile and settings"
        title={`${user.name} (${user.email})`}
        onClick={() => setOpen((o) => !o)}
      >
        {initials}
      </button>
      {open && (
        <div className="profile-pop" role="menu">
          {!settings ? (
            <>
              <div className="profile-head">
                <span className="avatar av-blue">{initials}</span>
                <span className="profile-id">
                  <strong>{user.name}</strong>
                  <span className="muted">{user.email}</span>
                </span>
              </div>
              <button type="button" className="profile-item" role="menuitem" onClick={() => setSettings(true)}>
                Settings
              </button>
              <button type="button" className="profile-item danger" role="menuitem" onClick={signOut}>
                Sign out
              </button>
              <p className="muted profile-note">Demo workspace. Sign-in is simulated, nothing leaves this browser.</p>
            </>
          ) : (
            <>
              <div className="profile-head">
                <strong>Display settings</strong>
                <button type="button" className="link-btn" onClick={() => setSettings(false)}>
                  Back
                </button>
              </div>
              <label className="set-row">
                <span>
                  <strong>Compact rows</strong>
                  <span className="muted">Tighter run and member lists.</span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.compact}
                  onChange={(e) => setPrefs((p) => ({ ...p, compact: e.target.checked }))}
                />
              </label>
              <label className="set-row">
                <span>
                  <strong>Calm motion</strong>
                  <span className="muted">Skips the entry splash and transitions.</span>
                </span>
                <input
                  type="checkbox"
                  checked={prefs.calm}
                  onChange={(e) => setPrefs((p) => ({ ...p, calm: e.target.checked }))}
                />
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<View>({ name: "overview" });
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    api<{ ok: boolean }>("/health")
      .then(() => live && setBackendOk(true))
      .catch(() => live && setBackendOk(false));
    return () => {
      live = false;
    };
  }, []);

  const go = (v: View) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  const navKey = view.name === "run" ? "runs" : view.name === "team" ? "teams" : view.name;

  return (
    <div className="shell">
      <Splash />
      <header className="topbar">
        <div className="brand" onClick={() => go({ name: "overview" })}>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="brand-name">
            <strong>meta</strong>Flow
          </span>
        </div>
        <div className="topbar-right">
          <span className={`env-badge ${backendOk ? "on" : backendOk === false ? "off" : ""}`}>
            {backendOk === null ? "checking backend…" : backendOk ? "backend connected" : "backend offline"}
          </span>
          <ProfileMenu />
        </div>
      </header>

      {backendOk === false && (
        <div className="offline-banner">
          <strong>Backend is offline.</strong> The dashboard cannot load runs or teams until it is
          running. Start it with{" "}
          <code>cd backend &amp;&amp; source ../.venv/bin/activate &amp;&amp; uvicorn app.main:app --port 8000</code>{" "}
          then <button className="link-btn" onClick={() => window.location.reload()}>reload this page</button>.
        </div>
      )}

      <div className="body">
        <nav className="sidebar">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={navKey === n.key ? "active" : ""}
              onClick={() => go({ name: n.key } as View)}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <main className="content">
          {view.name === "overview" && <Overview go={go} />}
          {view.name === "new" && <NewRun go={go} />}
          {view.name === "runs" && <Runs go={go} />}
          {view.name === "run" && <RunDetailPage id={view.id} go={go} />}
          {view.name === "teams" && <Teams go={go} />}
          {view.name === "team" && <TeamPage id={view.id} go={go} />}
          {view.name === "diag" && <Diagnostics go={go} />}
        </main>
      </div>

      <footer className="foot">
        <span className="muted">
          metaFlow · standups in, verified PRs out · ENV=dev runs free local fallbacks
        </span>
        <span className="muted num">muse-voice-transcribe · muse-spark-open-1026 · muse-wonder-1.0 · muse-image</span>
      </footer>
    </div>
  );
}
