from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import job_application_copilot.main as app_module


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    database_file = tmp_path / "test.db"

    test_engine = create_engine(
        f"sqlite:///{database_file}",
        connect_args={"check_same_thread": False},
    )

    test_session_factory = sessionmaker(
        bind=test_engine,
        autoflush=False,
        autocommit=False,
    )

    monkeypatch.setattr(app_module, "engine", test_engine)
    monkeypatch.setattr(
        app_module, "SessionLocal", test_session_factory
    )

    try:
        with TestClient(app_module.app) as test_client:
            yield test_client
    finally:
        test_engine.dispose()


@pytest.fixture
def career_profile(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    profile = tmp_path / "career"
    profile.mkdir()

    (profile / "RULES.md").write_text(
        "Use documented facts only.", encoding="utf-8"
    )
    (profile / "PROFILE.md").write_text(
        "Example candidate.", encoding="utf-8"
    )

    projects = profile / "projects"
    projects.mkdir()
    (projects / "example.md").write_text(
        "Built a prototype.", encoding="utf-8"
    )

    monkeypatch.setenv("CAREER_PROFILE_DIRECTORY", str(profile))
    return profile
