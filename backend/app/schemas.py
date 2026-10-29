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
    run_id: str = ""
    transcript: TranscriptSchema
    draft: DraftDiffSchema
    checks: CheckReportSchema
    critic: CriticReportSchema
    diagram: DiagramSchema
    telemetry_ms: dict[str, float] = Field(default_factory=dict)


class TeamCreate(BaseModel):
    name: str


class TeamSummary(BaseModel):
    id: str
    name: str
    created_at: float
    member_count: int = 0
    sample_members: list[str] = Field(default_factory=list)


class MemberCreate(BaseModel):
    name: str
    role: str = "member"


class Member(BaseModel):
    id: str
    team_id: str
    name: str
    role: str
    created_at: float


class TeamDetail(BaseModel):
    id: str
    name: str
    created_at: float
    members: list[Member] = Field(default_factory=list)
    recent_runs: list["RunSummary"] = Field(default_factory=list)


class RunSummary(BaseModel):
    id: str
    team_id: str | None = None
    title: str
    mode: str
    status: str
    created_at: float
    updated_at: float


class StageEvent(BaseModel):
    stage: str
    state: str
    detail: str = ""
    ms: float = 0.0
    at: float = 0.0


class RunDetail(RunSummary):
    events: list[StageEvent] = Field(default_factory=list)
    result: PipelineRunResponse | None = None


class SetupCheck(BaseModel):
    name: str
    ok: bool
    detail: str = ""


TeamDetail.model_rebuild()
