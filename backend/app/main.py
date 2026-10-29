import platform
import shutil
import sys

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from app import db, models
from app import seed as demo_seed
from app.checks import run_checks
from app.config import settings
from app.pipeline import run_pipeline
from app.schemas import (
    CheckReportSchema,
    DraftDiffSchema,
    Member,
    MemberCreate,
    PipelineRunRequest,
    PipelineRunResponse,
    RunDetail,
    RunSummary,
    SetupCheck,
    TeamCreate,
    TeamDetail,
    TeamSummary,
    TranscriptSchema,
)

app = FastAPI(title="metaFlow", version="0.2.0")


# -- health & setup -------------------------------------------------------


@app.get("/health")
def health() -> dict:
    return {"ok": True, "env": settings.env}


@app.get("/setup/status", response_model=list[SetupCheck])
def setup_status() -> list[SetupCheck]:
    out: list[SetupCheck] = []

    def check(name: str, ok: bool, detail: str = "") -> None:
        out.append(SetupCheck(name=name, ok=ok, detail=detail))

    check("python", sys.version_info >= (3, 11), platform.python_version())
    try:
        import fastapi, pydantic  # noqa: F401

        check("backend deps", True, f"fastapi + pydantic importable")
    except ImportError as e:
        check("backend deps", False, str(e))
    try:
        db.connect().close()
        check("run database", True, str(db.db_path()))
    except Exception as e:
        check("run database", False, f"{type(e).__name__}: {e}")
    check("environment", True, f"ENV={settings.env}")
    check(
        "meta api key",
        bool(settings.meta_api_key),
        "set" if settings.meta_api_key else "missing. Running on dev fallbacks ($0)",
    )
    check(
        "baseten api key",
        bool(settings.baseten_api_key),
        "set" if settings.baseten_api_key else "missing. Spark Open drafts use the local fallback",
    )
    ffmpeg = shutil.which("ffmpeg")
    check("ffmpeg", ffmpeg is not None, ffmpeg or "not found. Audio uploads need FFmpeg for 16kHz conversion")
    check(
        "critic budget",
        1 <= settings.max_critic_retries <= 5,
        f"MAX_CRITIC_RETRIES={settings.max_critic_retries}",
    )
    return out


def _require_dev() -> None:
    if not settings.is_dev:
        raise HTTPException(status_code=403, detail="demo seeding is only available in ENV=dev")


@app.post("/setup/seed")
def seed() -> dict:
    _require_dev()
    return demo_seed.seed_demo()


@app.post("/setup/reset")
def reset() -> dict:
    _require_dev()
    return demo_seed.reset_workspace()


# -- single steps ----------------------------------------------------------


@app.post("/pipeline/transcribe", response_model=TranscriptSchema)
async def transcribe(file: UploadFile = File(...)) -> TranscriptSchema:
    wav = await file.read()
    return models.transcribe_audio(wav)


@app.post("/pipeline/draft", response_model=DraftDiffSchema)
def draft(req: PipelineRunRequest) -> DraftDiffSchema:
    t = TranscriptSchema.model_validate({"turns": [], "language": "en"})
    return models.draft_diff(t, req.title)


@app.post("/pipeline/verify", response_model=CheckReportSchema)
def verify(draft: DraftDiffSchema) -> CheckReportSchema:
    return run_checks(draft)


@app.post("/pipeline/run", response_model=PipelineRunResponse)
async def run(
    title: str = Form("Untitled standup PR"),
    mode: str = Form("audio"),
    pr_url: str = Form(""),
    team_id: str = Form(""),
    file: UploadFile | None = None,
) -> PipelineRunResponse:
    audio = await file.read() if file is not None else b""
    req = PipelineRunRequest(mode=mode, pr_url=pr_url, title=title)  # type: ignore[arg-type]
    try:
        return run_pipeline(req, audio, team_id or None)
    except KeyError:
        raise HTTPException(status_code=404, detail="team not found")


# -- teams -----------------------------------------------------------------


@app.post("/teams", response_model=TeamSummary)
def create_team(body: TeamCreate) -> TeamSummary:
    try:
        return TeamSummary.model_validate(db.create_team(body.name))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/teams", response_model=list[TeamSummary])
def teams() -> list[TeamSummary]:
    return [TeamSummary.model_validate(t) for t in db.list_teams()]


@app.get("/teams/{team_id}", response_model=TeamDetail)
def team_detail(team_id: str) -> TeamDetail:
    t = db.get_team(team_id)
    if t is None:
        raise HTTPException(status_code=404, detail="team not found")
    return TeamDetail.model_validate(t)


@app.post("/teams/{team_id}/members", response_model=Member)
def add_team_member(team_id: str, body: MemberCreate) -> Member:
    try:
        return Member.model_validate(db.add_member(team_id, body.name, body.role))
    except KeyError:
        raise HTTPException(status_code=404, detail="team not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/teams/{team_id}/members/{member_id}")
def remove_team_member(team_id: str, member_id: str) -> dict:
    _ = team_id
    if not db.remove_member(member_id):
        raise HTTPException(status_code=404, detail="member not found")
    return {"ok": True}


# -- run history -----------------------------------------------------------


@app.get("/runs", response_model=list[RunSummary])
def runs(team_id: str | None = None, limit: int = 50) -> list[RunSummary]:
    return [RunSummary.model_validate(r) for r in db.list_runs(team_id, min(limit, 200))]


@app.get("/runs/{run_id}", response_model=RunDetail)
def run_detail(run_id: str) -> RunDetail:
    r = db.get_run(run_id)
    if r is None:
        raise HTTPException(status_code=404, detail="run not found")
    if r.get("result") and r["result"].get("transcript") is not None:
        return RunDetail.model_validate(r)
    r["result"] = None
    return RunDetail.model_validate(r)
