"""Demo seeding. Fabricates a lived-in workspace (teams, people, runs with full
artifacts) so the dashboard can be evaluated without running the pipeline.
Dev-only: the endpoints that call this refuse when ENV != dev.
"""

import time

from app import db

DAY = 86400.0


def _turns() -> list[dict]:
    return [
        {"speaker": "SPEAKER_00", "start_ms": 0, "end_ms": 4200, "text": "Morning. Failed card charges are retrying too aggressively, customers see triple holds."},
        {"speaker": "SPEAKER_01", "start_ms": 4300, "end_ms": 9100, "text": "Agreed, the retry worker fires every thirty seconds. Back it off and batch the status sync."},
        {"speaker": "SPEAKER_00", "start_ms": 9200, "end_ms": 13400, "text": "Ship it today if checks stay green. Keep the email copy untouched."},
    ]


def _ok_result(title: str, summary: str, files: list[str], tests: list[str], diff: str, retries: int, telev: dict[str, float]) -> dict:
    return {
        "run_id": "",
        "transcript": {"turns": _turns(), "language": "en"},
        "draft": {"summary": summary, "files_changed": files, "unified_diff": diff, "tests_added": tests},
        "checks": {
            "passed": True,
            "results": [
                {"name": "diff_nonempty", "passed": True, "detail": "diff must not be empty"},
                {"name": "tests_present", "passed": True, "detail": "at least one test file required"},
                {"name": "files_declared", "passed": True, "detail": "files_changed must list touched files"},
            ],
        },
        "critic": {"verdict": "pass", "violations": [], "fix_instructions": "", "retries_used": retries},
        "diagram": {"image_url": "", "prompt_used": summary, "fallback_svg": ""},
        "telemetry_ms": telev,
    }


def _events_ok(telev: dict[str, float], critic_attempts: int = 1) -> list[dict]:
    now = time.time()
    ev = [
        {"stage": "transcribe", "state": "running", "detail": "", "ms": 0.0, "at": now},
        {"stage": "transcribe", "state": "done", "detail": "3 turns", "ms": telev["transcribe_ms"], "at": now},
        {"stage": "draft", "state": "running", "detail": "", "ms": 0.0, "at": now},
        {"stage": "draft", "state": "done", "detail": "", "ms": telev["draft_ms"], "at": now},
        {"stage": "checks", "state": "running", "detail": "", "ms": 0.0, "at": now},
        {"stage": "checks", "state": "done", "detail": "3/3 passed", "ms": telev["checks_ms"], "at": now},
    ]
    for a in range(1, critic_attempts + 1):
        ev.append({"stage": "critic", "state": "running", "detail": f"attempt {a}", "ms": 0.0, "at": now})
        if a < critic_attempts:
            ev.append({"stage": "critic", "state": "failed", "detail": "tests_present: at least one test file required", "ms": 0.0, "at": now})
        else:
            ev.append({"stage": "critic", "state": "done", "detail": "verdict: pass", "ms": 0.0, "at": now})
    ev.append({"stage": "diagram", "state": "running", "detail": "", "ms": 0.0, "at": now})
    ev.append({"stage": "diagram", "state": "done", "detail": "", "ms": telev["diagram_ms"], "at": now})
    return ev


def seed_demo() -> dict:
    reset_workspace()
    now = time.time()
    teams = {
        "Payments": ["Ada Lovelace", "Grace Hopper", "Lin Zhang"],
        "Mobile": ["Priya Nair", "Sam Okafor"],
        "Growth": ["Mara Silva", "Theo Park", "June Kim", "Kai Müller"],
    }
    team_ids: dict[str, str] = {}
    member_count = 0
    for name, people in teams.items():
        t = db.create_team(name)
        team_ids[name] = t["id"]
        for i, person in enumerate(people):
            db.add_member(t["id"], person, "dev" if i == 0 else "member")
            member_count += 1

    runs: list[tuple[str, str, str, str, float, str, dict | None, list[dict]]] = [
        (
            "Retry failed card charges",
            "audio",
            team_ids["Payments"],
            "done",
            now - 2 * 3600,
            "retry-worker",
            _ok_result(
                "Retry failed card charges",
                "Back off the retry worker to exponential intervals and batch the status sync.",
                ["backend/workers/retry.py"],
                ["tests/test_retry_backoff.py"],
                "--- a/backend/workers/retry.py\n+++ b/backend/workers/retry.py\n@@\n-RETRY_EVERY = 30\n+RETRY_EVERY = [30, 120, 600]\n",
                1,
                {"transcribe_ms": 41.2, "draft_ms": 12.6, "checks_ms": 0.4, "critic_ms": 3.1, "diagram_ms": 1.2},
            ),
            _events_ok({"transcribe_ms": 41.2, "draft_ms": 12.6, "checks_ms": 0.4, "critic_ms": 3.1, "diagram_ms": 1.2}, critic_attempts=2),
        ),
        (
            "Fix offline sync conflict banner",
            "pr_url",
            team_ids["Mobile"],
            "done",
            now - 26 * 3600,
            "sync-banner",
            _ok_result(
                "Fix offline sync conflict banner",
                "Show the conflict banner only when the local queue actually diverges.",
                ["mobile/sync/banner.tsx"],
                ["mobile/sync/banner.test.tsx"],
                "--- a/mobile/sync/banner.tsx\n+++ b/mobile/sync/banner.tsx\n@@\n-const show = queue.length > 0;\n+const show = queue.some((q) => q.diverged);\n",
                0,
                {"transcribe_ms": 0.0, "draft_ms": 9.8, "checks_ms": 0.3, "critic_ms": 1.9, "diagram_ms": 0.9},
            ),
            _events_ok({"transcribe_ms": 0.0, "draft_ms": 9.8, "checks_ms": 0.3, "critic_ms": 1.9, "diagram_ms": 0.9}),
        ),
        (
            "Onboarding checklist progress",
            "audio",
            team_ids["Growth"],
            "needs_fix",
            now - 3 * DAY,
            "onboarding",
            {
                "run_id": "",
                "transcript": {"turns": _turns(), "language": "en"},
                "draft": {
                    "summary": "Persist checklist state per workspace instead of per device.",
                    "files_changed": ["web/onboarding/store.ts"],
                    "unified_diff": "--- a/web/onboarding/store.ts\n+++ b/web/onboarding/store.ts\n@@\n-const key = 'checklist';\n+const key = `checklist:${workspaceId}`;\n",
                    "tests_added": [],
                },
                "checks": {
                    "passed": False,
                    "results": [
                        {"name": "diff_nonempty", "passed": True, "detail": "diff must not be empty"},
                        {"name": "tests_present", "passed": False, "detail": "at least one test file required"},
                        {"name": "files_declared", "passed": True, "detail": "files_changed must list touched files"},
                    ],
                },
                "critic": {
                    "verdict": "needs_fix",
                    "violations": ["tests_present: at least one test file required"],
                    "fix_instructions": "tests_present: at least one test file required",
                    "retries_used": 3,
                },
                "diagram": {"image_url": "", "prompt_used": "Persist checklist state per workspace instead of per device.", "fallback_svg": ""},
                "telemetry_ms": {"transcribe_ms": 38.4, "draft_ms": 11.1, "checks_ms": 0.4, "critic_ms": 6.7, "diagram_ms": 1.0},
            },
            [
                {"stage": "transcribe", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "transcribe", "state": "done", "detail": "3 turns", "ms": 38.4, "at": now},
                {"stage": "draft", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "draft", "state": "done", "detail": "", "ms": 11.1, "at": now},
                {"stage": "checks", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "checks", "state": "failed", "detail": "2/3 passed", "ms": 0.4, "at": now},
                {"stage": "critic", "state": "running", "detail": "attempt 1", "ms": 0.0, "at": now},
                {"stage": "critic", "state": "failed", "detail": "tests_present: at least one test file required", "ms": 0.0, "at": now},
                {"stage": "critic", "state": "running", "detail": "attempt 2", "ms": 0.0, "at": now},
                {"stage": "critic", "state": "failed", "detail": "tests_present: at least one test file required", "ms": 0.0, "at": now},
                {"stage": "critic", "state": "running", "detail": "attempt 3", "ms": 0.0, "at": now},
                {"stage": "critic", "state": "failed", "detail": "tests_present: at least one test file required", "ms": 0.0, "at": now},
                {"stage": "diagram", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "diagram", "state": "done", "detail": "", "ms": 1.0, "at": now},
            ],
        ),
        (
            "Refund receipt email copy",
            "pr_url",
            team_ids["Payments"],
            "error",
            now - 4 * DAY,
            "refund-email",
            None,
            [
                {"stage": "transcribe", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "transcribe", "state": "done", "detail": "1 turn", "ms": 22.9, "at": now},
                {"stage": "draft", "state": "running", "detail": "", "ms": 0.0, "at": now},
                {"stage": "pipeline", "state": "error", "detail": "RuntimeError: draft service timed out after 30s", "ms": 0.0, "at": now},
            ],
        ),
        (
            "Push token refresh race",
            "audio",
            team_ids["Mobile"],
            "done",
            now - 6 * DAY,
            "push-race",
            _ok_result(
                "Push token refresh race",
                "Serialize token refresh behind a single-flight lock.",
                ["mobile/push/tokens.ts"],
                ["mobile/push/tokens.test.ts"],
                "--- a/mobile/push/tokens.ts\n+++ b/mobile/push/tokens.ts\n@@\n-export async function refresh() {\n+let inflight: Promise<void> | null = null;\n+export function refresh() {\n+  inflight ??= doRefresh().finally(() => (inflight = null));\n+  return inflight;\n",
                0,
                {"transcribe_ms": 44.7, "draft_ms": 10.4, "checks_ms": 0.3, "critic_ms": 2.2, "diagram_ms": 1.1},
            ),
            _events_ok({"transcribe_ms": 44.7, "draft_ms": 10.4, "checks_ms": 0.3, "critic_ms": 2.2, "diagram_ms": 1.1}),
        ),
        (
            "Paywall experiment variant C",
            "pr_url",
            team_ids["Growth"],
            "done",
            now - 8 * DAY,
            "paywall-c",
            _ok_result(
                "Paywall experiment variant C",
                "Gate variant C behind the experiment flag with a 10 percent rollout.",
                ["web/paywall/flags.ts"],
                ["web/paywall/flags.test.ts"],
                "--- a/web/paywall/flags.ts\n+++ b/web/paywall/flags.ts\n@@\n+export const PAYWALL_C = flag('paywall-c', { rollout: 0.1 });\n",
                1,
                {"transcribe_ms": 0.0, "draft_ms": 8.9, "checks_ms": 0.3, "critic_ms": 2.8, "diagram_ms": 0.8},
            ),
            _events_ok({"transcribe_ms": 0.0, "draft_ms": 8.9, "checks_ms": 0.3, "critic_ms": 2.8, "diagram_ms": 0.8}, critic_attempts=2),
        ),
    ]

    import json

    run_count = 0
    with db.connect() as conn:
        for title, mode, team_id, status, created, _slug, result, events in runs:
            run_id = f"run_demo{run_count}"
            payload = {"error": "seeded error placeholder"} if result is None else result
            if result is not None:
                result["run_id"] = run_id
            conn.execute(
                "INSERT INTO runs (id, team_id, title, mode, status, created_at, updated_at, events_json, result_json) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (run_id, team_id, title, mode, status, created, created + 4.2,
                 json.dumps(events), json.dumps(payload)),
            )
            run_count += 1

    return {"teams": len(team_ids), "members": member_count, "runs": run_count}


def reset_workspace() -> dict:
    with db.connect() as conn:
        members = conn.execute("DELETE FROM members").rowcount or 0
        runs = conn.execute("DELETE FROM runs").rowcount or 0
        teams = conn.execute("DELETE FROM teams").rowcount or 0
    return {"teams": teams, "members": members, "runs": runs}
