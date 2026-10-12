from fastapi.testclient import TestClient


def test_saved_draft_can_be_retrieved(client: TestClient):
    payload = {
        "job_description": "Example embedded engineering role.",
        "draft": {
            "selected_experiences": [
                {
                    "source_path": "projects/example.md",
                    "title": "Example Project",
                    "relevance_reason": "Relevant embedded experience.",
                    "suggested_bullets": ["Built a prototype."],
                }
            ],
            "missing_information": [],
        },
        "included_paths": [],
    }

    saved = client.post("/drafts", json=payload)

    assert saved.status_code == 201
    draft_id = saved.json()["id"]

    loaded = client.get(f"/drafts/{draft_id}")

    assert loaded.status_code == 200
    data = loaded.json()

    assert data["id"] == draft_id
    assert data["job_description"] == payload["job_description"]
    assert data["draft"] == payload["draft"]
    assert data["included_paths"] == []

def test_update_changes_existing_draft_without_creating_another(
    client: TestClient,
):
    payload = {
        "job_description": "Example embedded engineering role.",
        "draft": {
            "selected_experiences": [
                {
                    "source_path": "projects/example.md",
                    "title": "Example Project",
                    "relevance_reason": "Relevant embedded experience.",
                    "suggested_bullets": ["Original bullet."],
                }
            ],
            "missing_information": [],
        },
        "included_paths": ["projects/example.md"],
    }

    created = client.post("/drafts", json=payload)
    assert created.status_code == 201
    draft_id = created.json()["id"]

    original = client.get(f"/drafts/{draft_id}")
    assert original.status_code == 200

    payload["draft"]["selected_experiences"][0]["suggested_bullets"] = [
        "Edited bullet."
    ]
    payload["included_paths"] = []

    updated = client.put(f"/drafts/{draft_id}", json=payload)
    assert updated.status_code == 200
    assert updated.json()["id"] == draft_id

    loaded = client.get(f"/drafts/{draft_id}")
    assert loaded.status_code == 200
    data = loaded.json()

    assert data["draft"] == payload["draft"]
    assert data["included_paths"] == []
    assert data["created_at"] == original.json()["created_at"]

    listing = client.get("/drafts")
    assert listing.status_code == 200
    assert [item["id"] for item in listing.json()] == [draft_id]


def test_get_missing_draft_returns_404(client: TestClient):
    response = client.get("/drafts/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Draft not found."


def test_invalid_included_path_is_rejected_without_saving(
    client: TestClient,
):
    payload = {
        "job_description": "Example engineering role.",
        "draft": {
            "selected_experiences": [
                {
                    "source_path": "projects/example.md",
                    "title": "Example Project",
                    "relevance_reason": "Relevant experience.",
                    "suggested_bullets": ["Built a prototype."],
                }
            ],
            "missing_information": [],
        },
        "included_paths": ["projects/not_in_draft.md"],
    }

    response = client.post("/drafts", json=payload)

    assert response.status_code == 422

    listing = client.get("/drafts")
    assert listing.status_code == 200
    assert listing.json() == []
