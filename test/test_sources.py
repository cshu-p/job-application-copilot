from pathlib import Path

from fastapi.testclient import TestClient


def test_source_returns_documented_content(
    client: TestClient,
    career_profile: Path,
):
    response = client.get(
        "/sources",
        params={"source_path": "projects/example.md"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "source_path": "projects/example.md",
        "content": "Built a prototype.",
    }


def test_source_rejects_path_outside_profile(
    client: TestClient,
    career_profile: Path,
):
    outside_file = career_profile.parent / "private.txt"
    outside_file.write_text(
        "This content must not be returned.", encoding="utf-8"
    )

    response = client.get(
        "/sources",
        params={"source_path": "../private.txt"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Career source not found."
