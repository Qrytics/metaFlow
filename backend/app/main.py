from fastapi import FastAPI, File, Form, UploadFile

from app import models
from app.checks import run_checks
from app.pipeline import run_pipeline
from app.schemas import CheckReportSchema, DraftDiffSchema, PipelineRunRequest, PipelineRunResponse, TranscriptSchema

app = FastAPI(title="metaFlow", version="0.1.0")


@app.get("/health")
def health() -> dict:
    from app.config import settings

    return {"ok": True, "env": settings.env}


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
    file: UploadFile | None = None,
) -> PipelineRunResponse:
    audio = await file.read() if file is not None else b""
    req = PipelineRunRequest(mode=mode, pr_url=pr_url, title=title)  # type: ignore[arg-type]
    return run_pipeline(req, audio)
