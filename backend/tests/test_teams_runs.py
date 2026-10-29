import pytest
from fastapi.testclient import TestClient

from app import db
from app.main import app


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("META_FLOW_DATA_DIR", str(tmp_path))
    import app.config as cfg

    monkeypatch.setattr(cfg.settings, "data_dir", str(tmp_path))
    return TestClient(app)


def test_teams_and_members_flow(client):
    r = client.post("/teams", json={"name": "  "})
    assert r.status_code == 400

    r = client.post("/teams", json={"name": "Payments"})
    assert r.status_code == 200
    team_id = r.json()["id"]

    r = client.post(f"/teams/{team_id}/members", json={"name": "Ada", "role": "dev"})
    assert r.status_code == 200
    member_id = r.json()["id"]

    r = client.get(f"/teams/{team_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Payments"
    assert [m["name"] for m in body["members"]] == ["Ada"]

    r = client.get("/teams")
    assert any(t["id"] == team_id and t["member_count"] == 1 for t in r.json())

    r = client.delete(f"/teams/{team_id}/members/{member_id}")
    assert r.status_code == 200
    assert client.get(f"/teams/{team_id}").json()["members"] == []


def test_run_persists_with_events_and_team(client):
    team_id = client.post("/teams", json={"name": "Mobile"}).json()["id"]
    r = client.post(
        "/pipeline/run",
        data={"title": "login retry", "mode": "pr_url", "pr_url": "http://x/1", "team_id": team_id},
    )
    assert r.status_code == 200
    run_id = r.json()["run_id"]
    assert run_id

    detail = client.get(f"/runs/{run_id}").json()
    assert detail["status"] == "done"
    assert [e["stage"] for e in detail["events"]] == [
        "transcribe",
        "transcribe",
        "draft",
        "draft",
        "checks",
        "checks",
        "critic",
        "critic",
        "diagram",
        "diagram",
    ]
    assert detail["result"]["draft"]["tests_added"]

    listing = client.get("/runs", params={"team_id": team_id}).json()
    assert [x["id"] for x in listing] == [run_id]

    assert client.post("/pipeline/run", data={"title": "x", "team_id": "team_nope"}).status_code == 404


def test_setup_status_shape(client):
    r = client.get("/setup/status")
    assert r.status_code == 200
    names = {c["name"] for c in r.json()}
    assert {"python", "backend deps", "run database", "meta api key", "ffmpeg"} <= names
    assert all("ok" in c and "detail" in c for c in r.json())


def test_unknown_ids_404(client):
    assert client.get("/teams/team_nope").status_code == 404
    assert client.get("/runs/run_nope").status_code == 404
    assert client.delete("/teams/x/members/mem_nope").status_code == 404
