"""SQLite store (stdlib only, no new dependencies).

Tables: teams, members, runs. Every pipeline execution is persisted with its
per-stage event log so the dashboard can replay and troubleshoot any run.
"""

import json
import sqlite3
import time
import uuid
from pathlib import Path

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  team_id TEXT REFERENCES teams(id),
  title TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at REAL NOT NULL,
  updated_at REAL NOT NULL,
  events_json TEXT NOT NULL DEFAULT '[]',
  result_json TEXT NOT NULL DEFAULT '{}'
);
"""


def db_path() -> Path:
    data = Path(settings.data_dir)
    data.mkdir(parents=True, exist_ok=True)
    return data / "metaflow.db"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path())
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


# -- teams ---------------------------------------------------------------


def create_team(name: str) -> dict:
    name = name.strip()
    if not name:
        raise ValueError("team name must not be empty")
    with connect() as conn:
        team_id = _new_id("team")
        now = time.time()
        conn.execute(
            "INSERT INTO teams (id, name, created_at) VALUES (?, ?, ?)",
            (team_id, name, now),
        )
        return {"id": team_id, "name": name, "created_at": now, "member_count": 0}


def list_teams() -> list[dict]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM teams ORDER BY created_at DESC").fetchall()
        out = []
        for r in rows:
            n = conn.execute(
                "SELECT COUNT(*) AS c FROM members WHERE team_id = ?", (r["id"],)
            ).fetchone()["c"]
            out.append(
                {"id": r["id"], "name": r["name"], "created_at": r["created_at"], "member_count": n}
            )
        return out


def get_team(team_id: str) -> dict | None:
    with connect() as conn:
        r = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
        if r is None:
            return None
        members = conn.execute(
            "SELECT * FROM members WHERE team_id = ? ORDER BY created_at", (team_id,)
        ).fetchall()
        runs = conn.execute(
            "SELECT id, title, mode, status, created_at, updated_at FROM runs "
            "WHERE team_id = ? ORDER BY created_at DESC LIMIT 20",
            (team_id,),
        ).fetchall()
        return {
            "id": r["id"],
            "name": r["name"],
            "created_at": r["created_at"],
            "members": [dict(m) for m in members],
            "recent_runs": [dict(x) for x in runs],
        }


def add_member(team_id: str, name: str, role: str = "member") -> dict:
    name = name.strip()
    if not name:
        raise ValueError("member name must not be empty")
    if get_team(team_id) is None:
        raise KeyError("team not found")
    with connect() as conn:
        mid = _new_id("mem")
        now = time.time()
        conn.execute(
            "INSERT INTO members (id, team_id, name, role, created_at) VALUES (?, ?, ?, ?, ?)",
            (mid, team_id, name, role or "member", now),
        )
        return {"id": mid, "team_id": team_id, "name": name, "role": role or "member", "created_at": now}


def remove_member(member_id: str) -> bool:
    with connect() as conn:
        cur = conn.execute("DELETE FROM members WHERE id = ?", (member_id,))
        return cur.rowcount > 0


# -- runs ----------------------------------------------------------------


def create_run(title: str, mode: str, team_id: str | None = None) -> str:
    if team_id is not None and get_team(team_id) is None:
        raise KeyError("team not found")
    with connect() as conn:
        run_id = _new_id("run")
        now = time.time()
        conn.execute(
            "INSERT INTO runs (id, team_id, title, mode, status, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, 'running', ?, ?)",
            (run_id, team_id, title.strip() or "Untitled run", mode, now, now),
        )
        return run_id


def append_event(run_id: str, stage: str, state: str, detail: str = "", ms: float = 0.0) -> None:
    with connect() as conn:
        row = conn.execute("SELECT events_json FROM runs WHERE id = ?", (run_id,)).fetchone()
        if row is None:
            return
        events = json.loads(row["events_json"])
        events.append(
            {"stage": stage, "state": state, "detail": detail, "ms": ms, "at": time.time()}
        )
        conn.execute(
            "UPDATE runs SET events_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(events), time.time(), run_id),
        )


def finish_run(run_id: str, status: str, result: dict) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE runs SET status = ?, result_json = ?, updated_at = ? WHERE id = ?",
            (status, json.dumps(result), time.time(), run_id),
        )


def list_runs(team_id: str | None = None, limit: int = 50) -> list[dict]:
    with connect() as conn:
        if team_id:
            rows = conn.execute(
                "SELECT id, team_id, title, mode, status, created_at, updated_at FROM runs "
                "WHERE team_id = ? ORDER BY created_at DESC LIMIT ?",
                (team_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT id, team_id, title, mode, status, created_at, updated_at FROM runs "
                "ORDER BY created_at DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]


def get_run(run_id: str) -> dict | None:
    with connect() as conn:
        r = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
        if r is None:
            return None
        d = dict(r)
        d["events"] = json.loads(d.pop("events_json"))
        d["result"] = json.loads(d.pop("result_json"))
        return d
