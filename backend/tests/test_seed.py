import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    import app.config as cfg

    monkeypatch.setattr(cfg.settings, "data_dir", str(tmp_path))
    return TestClient(app)


def test_seed_reset_flow(client):
    r = client.post("/setup/seed")
    assert r.status_code == 200
    assert r.json() == {"teams": 3, "members": 9, "runs": 6}

    teams = client.get("/teams").json()
    assert {t["name"] for t in teams} == {"Payments", "Mobile", "Growth"}
    payments = next(t for t in teams if t["name"] == "Payments")
    assert payments["member_count"] == 3
    assert payments["sample_members"] == ["Ada Lovelace", "Grace Hopper", "Lin Zhang"]

    runs = client.get("/runs").json()
    assert len(runs) == 6
    assert {r["status"] for r in runs} == {"done", "needs_fix", "error"}

    detail = client.get("/runs/run_demo0").json()
    assert detail["status"] == "done"
    assert detail["result"]["draft"]["tests_added"] == ["tests/test_retry_backoff.py"]
    assert len(detail["events"]) == 12

    broken = client.get("/runs/run_demo3").json()
    assert broken["status"] == "error"
    assert broken["result"] is None
    assert broken["events"][-1]["state"] == "error"

    r = client.post("/setup/reset")
    assert r.status_code == 200
    assert r.json() == {"teams": 3, "members": 9, "runs": 6}
    assert client.get("/runs").json() == []
    assert client.get("/teams").json() == []


def test_seed_forbidden_outside_dev(client, monkeypatch):
    import app.config as cfg

    monkeypatch.setattr(cfg.settings, "env", "prod")
    assert client.post("/setup/seed").status_code == 403
    assert client.post("/setup/reset").status_code == 403
