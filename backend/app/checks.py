"""Deterministic pre-checks. These run before the critic LLM so the critic
spends tokens only on diagnosis, never on discovery.
"""

from app.schemas import CheckReportSchema, CheckResultSchema, DraftDiffSchema


def run_checks(draft: DraftDiffSchema) -> CheckReportSchema:
    results = [
        CheckResultSchema(
            name="diff_nonempty",
            passed=bool(draft.unified_diff.strip()),
            detail="diff must not be empty",
        ),
        CheckResultSchema(
            name="tests_present",
            passed=bool(draft.tests_added),
            detail="at least one test file required",
        ),
        CheckResultSchema(
            name="files_declared",
            passed=bool(draft.files_changed),
            detail="files_changed must list touched files",
        ),
    ]
    return CheckReportSchema(passed=all(r.passed for r in results), results=results)


def violations_of(report: CheckReportSchema) -> list[str]:
    return [f"{r.name}: {r.detail}" for r in report.results if not r.passed]
