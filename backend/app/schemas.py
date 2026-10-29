from typing import Literal

from pydantic import BaseModel, Field


class SpeakerTurn(BaseModel):
    speaker: str = Field(description="e.g. SPEAKER_00 from diarization")
    start_ms: int
    end_ms: int
    text: str


class TranscriptSchema(BaseModel):
    turns: list[SpeakerTurn] = Field(default_factory=list)
    language: str = "en"


class DraftDiffSchema(BaseModel):
    summary: str
    files_changed: list[str] = Field(default_factory=list)
    unified_diff: str = ""
    tests_added: list[str] = Field(default_factory=list)


class CheckResultSchema(BaseModel):
    name: str
    passed: bool
    detail: str = ""


class CheckReportSchema(BaseModel):
    passed: bool
    results: list[CheckResultSchema] = Field(default_factory=list)


class CriticReportSchema(BaseModel):
    verdict: Literal["pass", "needs_fix"]
    violations: list[str] = Field(default_factory=list)
    fix_instructions: str = ""
    retries_used: int = 0


class DiagramSchema(BaseModel):
    image_url: str = ""
    prompt_used: str = ""
    fallback_svg: str = ""


class PipelineRunRequest(BaseModel):
    mode: Literal["audio", "pr_url"] = "audio"
    pr_url: str = ""
    title: str = "Untitled standup PR"


class PipelineRunResponse(BaseModel):
    transcript: TranscriptSchema
    draft: DraftDiffSchema
    checks: CheckReportSchema
    critic: CriticReportSchema
    diagram: DiagramSchema
    telemetry_ms: dict[str, float] = Field(default_factory=dict)
