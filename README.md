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

- `backend/` — FastAPI service (`app/`), deterministic check runners, tests.
- `frontend/` — React + TypeScript + Vite single-page pipeline UI.
- `docs/` — demo script, API notes.

## Quickstart

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add META_API_KEY + BASETEN_API_KEY, or use ENV=dev
uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

## API (v1)

- `POST /pipeline/run` — full standup-to-PR run (audio file or PR URL in).
- `POST /pipeline/transcribe` — voice step only.
- `POST /pipeline/draft` — Spark Open draft step only.
- `POST /pipeline/verify` — deterministic checks only.
- `POST /pipeline/critic` — Wonder critic repair loop only.
- `GET /health` — service + model reachability probe.
