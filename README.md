# metaFlow

Verifiable Standup-to-PR agent. Built for the Meta Global AI Developer Hackathon
(Build for Your World track).

Paste standup audio or a PR URL. metaFlow transcribes, drafts the diff plus
tests, runs real checks, self-corrects, and renders a change diagram.

## Pipeline

```
standup audio / PR URL
  -> muse-voice-transcribe (diarization, 20+ speakers)
  -> meta-models/muse-spark-open-1026 on Baseten (draft diff + tests)
  -> deterministic pre-checks (pytest, lint, typecheck)
  -> muse-wonder-1.0 critic (self-correct loop, MAX_CRITIC_RETRIES = 3)
  -> muse-image (architecture change diagram)
  -> verified PR artifact + critic diff log
```

`ENV=dev` swaps every model call for a deterministic local fallback ($0 cost).
No dynamic per-song/per-ticket data ever goes in a system prompt (prompt-caching
rule: static schemas on top, dynamic payload in the user message).

## Layout

- `backend/`: FastAPI service (`app/`) with deterministic check runners and tests.
- `frontend/`: React + TypeScript + Vite dashboard.
- `docs/`: demo script and API notes.

## Quickstart (2 minutes, $0)

```bash
cd backend
python3 -m venv ../.venv && source ../.venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # defaults to ENV=dev, so no keys are needed
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser.
The dashboard checks backend health on load and says exactly what to do if
something is down. `ENV=dev` runs the full pipeline on deterministic local
fallbacks, so nothing can fail for lack of API keys.

## Dashboard

| Page | What it does |
|---|---|
| Overview | Run stats, latest runs, how-a-run-works refresher. |
| New run | Title + team + audio file or PR URL, one button, auto-opens the result. |
| Runs | Every execution, filterable by team and status. Click to replay. |
| Run detail | Stage timeline with per-stage ms, transcript, diff, checks, critic report, diagram, telemetry. |
| Teams | Create groups, add/remove people, see each team's recent runs. |
| Diagnostics | One checklist for the whole system. Each red row names its fix. |

## If something breaks

1. Open Diagnostics in the dashboard. It names the exact failing part.
2. Open the failed run. The stage timeline shows the first red row.
3. `GET /setup/status` returns the same checklist as JSON for scripts.

Backend not reachable at all? Start it with the command in Quickstart, then
reload the page. That covers nearly every failure: the dashboard shows a banner
with the exact command until the backend answers `/health`.

## API (v1)

- `POST /pipeline/run`: full standup-to-PR run. Audio file or PR URL in.
- `POST /pipeline/transcribe`: voice step only.
- `POST /pipeline/draft`: Spark Open draft step only.
- `POST /pipeline/verify`: deterministic checks only.
- `POST /pipeline/critic`: Wonder critic repair loop only.
- `GET /health`: service and model reachability probe.
