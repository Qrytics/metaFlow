"""Model clients. Static prompts live here (prompt-caching rule).

Dynamic per-run data is passed only as the `user_payload` argument, which
callers must place in the user message, never the system prompt.
"""

from app.config import settings
from app.schemas import CriticReportSchema, DiagramSchema, DraftDiffSchema, TranscriptSchema

TRANSCRIBE_SYSTEM = "You transcribe standup audio. Output SpeakerTurn JSON only."
DRAFT_SYSTEM = (
    "You draft minimal code diffs plus tests as DraftDiffSchema JSON. "
    "Smallest diff that satisfies the request. No prose outside JSON."
)
CRITIC_SYSTEM = (
    "You are a verifiable playability-style critic for code diffs. "
    "Given a draft diff and a deterministic check report, output "
    "CriticReportSchema JSON with verdict pass|needs_fix, violations, "
    "and concrete fix_instructions. No prose outside JSON."
)
DIAGRAM_SYSTEM = "You render a minimal architecture change diagram. Flat style."


def transcribe_audio(_wav_bytes: bytes) -> TranscriptSchema:
    if settings.is_dev or not settings.meta_api_key:
        return TranscriptSchema.model_validate(
            {"turns": [{"speaker": "SPEAKER_00", "start_ms": 0, "end_ms": 1500, "text": "Ship the login retry fix today"}], "language": "en"}
        )
    raise NotImplementedError("live muse-voice-transcribe call goes here")


def draft_diff(transcript: TranscriptSchema, title: str) -> DraftDiffSchema:
    _ = (transcript, title)  # dynamic payload -> user message in the live call
    if settings.is_dev or not settings.baseten_api_key:
        return DraftDiffSchema(
            summary=f"Draft for: {title}",
            files_changed=["app/auth.py"],
            unified_diff="--- a/app/auth.py\n+++ b/app/auth.py\n@@ retry login once @@",
            tests_added=["tests/test_auth_retry.py"],
        )
    raise NotImplementedError("live meta-models/muse-spark-open-1026 call goes here")


def critic_repair(draft: DraftDiffSchema, violations: list[str], attempt: int) -> CriticReportSchema:
    _ = (draft, violations)  # dynamic payload -> user message in the live call
    if settings.is_dev or not settings.meta_api_key:
        if not violations:
            return CriticReportSchema(verdict="pass", retries_used=attempt)
        return CriticReportSchema(
            verdict="needs_fix",
            violations=violations,
            fix_instructions="; ".join(violations),
            retries_used=attempt,
        )
    raise NotImplementedError("live muse-wonder-1.0 critic call goes here")


def render_diagram(summary: str) -> DiagramSchema:
    _ = summary  # dynamic payload -> user message in the live call
    if settings.is_dev or not settings.meta_api_key:
        svg = "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='120'><rect width='320' height='120' fill='#0b0e14'/><text x='16' y='64' fill='#7dd3fc' font-size='14'>draft -&gt; checks -&gt; critic -&gt; PR</text></svg>"
        return DiagramSchema(prompt_used=summary, fallback_svg=svg)
    raise NotImplementedError("live muse-image call goes here")
