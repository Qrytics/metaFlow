import time

from app import checks, models
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


def run_pipeline(req: PipelineRunRequest, audio_bytes: bytes = b"") -> PipelineRunResponse:
    telemetry: dict[str, float] = {}

    if req.mode == "audio":
        transcript: TranscriptSchema = _timed("transcribe_ms", telemetry, models.transcribe_audio, audio_bytes)
    else:
        transcript = TranscriptSchema.model_validate(
            {"turns": [{"speaker": "SPEAKER_00", "start_ms": 0, "end_ms": 1000, "text": f"Review {req.pr_url}"}], "language": "en"}
        )
        telemetry["transcribe_ms"] = 0.0

    draft: DraftDiffSchema = _timed("draft_ms", telemetry, models.draft_diff, transcript, req.title)
    report: CheckReportSchema = _timed("checks_ms", telemetry, checks.run_checks, draft)

    critic = CriticReportSchema(verdict="pass")
    t0 = time.perf_counter()
    for attempt in range(settings.max_critic_retries + 1):
        critic = models.critic_repair(draft, checks.violations_of(report), attempt)
        if critic.verdict == "pass":
            break
        report = checks.run_checks(draft)  # re-run after (live: apply fix first)
        if attempt >= settings.max_critic_retries:
            break
    telemetry["critic_ms"] = (time.perf_counter() - t0) * 1000.0

    diagram: DiagramSchema = _timed("diagram_ms", telemetry, models.render_diagram, draft.summary)

    return PipelineRunResponse(
        transcript=transcript,
        draft=draft,
        checks=report,
        critic=critic,
        diagram=diagram,
        telemetry_ms=telemetry,
    )
