import { useEffect, useState } from "react";
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
          {view.name === "diag" && <Diagnostics />}
        </main>
      </div>
    </div>
  );
}
