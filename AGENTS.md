# AGENTS.md for metaFlow

## 0. Project identity

**metaFlow**: verifiable Standup-to-PR agent. Hackathon track: Build for Your
World (daily work speedup: standups + review queue become merge-ready PRs).

## 1. Tech stack (mandatory)

- Backend: Python 3.11 + FastAPI (`backend/`). Pydantic v2 schemas for every
  LLM output. Deterministic checks (pytest/lint/typecheck) run in-process
  before any critic call.
- Frontend: React + TypeScript + Vite (`frontend/`). One pipeline page, no
  generic AI chat UI.
- Audio precondition: convert uploads to mono 16-bit PCM WAV at 16kHz before
  calling `muse-voice-transcribe`.

## 2. Model routing (mandatory, exact IDs)

| # | Model ID | Role |
|---|----------|------|
| 1 | `muse-voice-transcribe` | Standup/meeting transcription + speaker attribution. |
| 2 | `meta-models/muse-spark-open-1026` (Baseten) | Draft diff + tests. Open-weight bonus track. Never the `-1026`-less ID. |
| 3 | `muse-wonder-1.0` | Verifiable critic: audits draft against check output, forces corrections. `muse-spark-1.3-contributor` when `ENV=dev`. |
| 4 | `muse-image` | Architecture change diagram for the verified PR. |
| 5 | `muse-spark-1.3` | Orchestration / routing fallback. |

## 3. Pipeline (mandatory)

transcribe -> draft (Spark Open) -> deterministic pre-checks -> critic
(Wonder, self-correct loop) -> image diagram. Critic receives the compact
check report + draft, never raw logs.

## 4. Prompt-caching rule (mandatory)

Static JSON schemas and grading rules go at the top of the system prompt.
All dynamic data (transcripts, diffs, check output) goes in the user message.

## 5. Cost controls (mandatory)

- `MAX_CRITIC_RETRIES = 3` per run. No unbounded loops.
- `ENV=dev` uses deterministic local fallbacks for every model call ($0).
- Critic LLM sees only the compact violation report, not full logs.

## 6. Scope notes

- New repo. No shared code with prior game work.
- Banned: basic RAG wrappers, HR screeners, medical, coaching, politics/war.
  Every artifact must be verifiable (tests pass/fail), not LLM opinion.
