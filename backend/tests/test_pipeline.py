from app.checks import run_checks, violations_of
from app.pipeline import run_pipeline
from app.schemas import DraftDiffSchema, PipelineRunRequest


def test_checks_require_diff_tests_and_files():
    empty = DraftDiffSchema(summary="x")
    report = run_checks(empty)
    assert not report.passed
    assert len(violations_of(report)) == 3


def test_full_pipeline_passes_in_dev():
    req = PipelineRunRequest(mode="audio", title="login retry")
    out = run_pipeline(req, b"fake-wav")
    assert out.checks.passed
    assert out.critic.verdict == "pass"
    assert out.draft.tests_added
    assert set(out.telemetry_ms) >= {"transcribe_ms", "draft_ms", "checks_ms", "critic_ms", "diagram_ms"}
