import time

from app import checks, db, models
from app.config import settings
from app.schemas import (
    CheckReportSchema,
    CriticReportSchema,
    DiagramSchema,
    DraftDiffSchema,
    PipelineRunRequest,
    PipelineRunResponse,
    TranscriptSchema,
)


def _timed(label: str, bag: dict[str, float], fn, *args):
    t0 = time.perf_counter()
    out = fn(*args)
    bag[label] = (time.perf_counter() - t0) * 1000.0
    return out


def run_pipeline(
    req: PipelineRunRequest, audio_bytes: bytes = b"", team_id: str | None = None
) -> PipelineRunResponse:
    telemetry: dict[str, float] = {}
    run_id = db.create_run(req.title, req.mode, team_id)
    db.append_event(run_id, "transcribe", "running")

    try:
        if req.mode == "audio":
            transcript: TranscriptSchema = _timed("transcribe_ms", telemetry, models.transcribe_audio, audio_bytes)
        else:
            transcript = TranscriptSchema.model_validate(
                {"turns": [{"speaker": "SPEAKER_00", "start_ms": 0, "end_ms": 1000, "text": f"Review {req.pr_url}"}], "language": "en"}
            )
            telemetry["transcribe_ms"] = 0.0
        db.append_event(run_id, "transcribe", "done", f"{len(transcript.turns)} turns", telemetry["transcribe_ms"])

        db.append_event(run_id, "draft", "running")
        draft: DraftDiffSchema = _timed("draft_ms", telemetry, models.draft_diff, transcript, req.title)
        db.append_event(run_id, "draft", "done", draft.summary, telemetry["draft_ms"])

        db.append_event(run_id, "checks", "running")
        report: CheckReportSchema = _timed("checks_ms", telemetry, checks.run_checks, draft)
        db.append_event(
            run_id, "checks", "done" if report.passed else "failed",
            f"{sum(1 for r in report.results if r.passed)}/{len(report.results)} passed",
            telemetry["checks_ms"],
        )

        critic = CriticReportSchema(verdict="pass")
        t0 = time.perf_counter()
        for attempt in range(settings.max_critic_retries + 1):
            db.append_event(run_id, "critic", "running", f"attempt {attempt + 1}")
            critic = models.critic_repair(draft, checks.violations_of(report), attempt)
            if critic.verdict == "pass":
                db.append_event(run_id, "critic", "done", "verdict: pass")
                break
            db.append_event(run_id, "critic", "failed", "; ".join(critic.violations))
            report = checks.run_checks(draft)  # re-run after (live: apply fix first)
            if attempt >= settings.max_critic_retries:
                break
        telemetry["critic_ms"] = (time.perf_counter() - t0) * 1000.0

        db.append_event(run_id, "diagram", "running")
        diagram: DiagramSchema = _timed("diagram_ms", telemetry, models.render_diagram, draft.summary)
        db.append_event(run_id, "diagram", "done", ms=telemetry["diagram_ms"])

        status = "done" if critic.verdict == "pass" else "needs_fix"
        resp = PipelineRunResponse(
            run_id=run_id,
            transcript=transcript,
            draft=draft,
            checks=report,
            critic=critic,
            diagram=diagram,
            telemetry_ms=telemetry,
        )
        db.finish_run(run_id, status, resp.model_dump())
        return resp
    except Exception as e:  # persisted so the dashboard can troubleshoot it
        db.append_event(run_id, "pipeline", "error", f"{type(e).__name__}: {e}")
        db.finish_run(run_id, "error", {"error": f"{type(e).__name__}: {e}"})
        raise
