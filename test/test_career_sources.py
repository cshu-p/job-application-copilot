from pathlib import Path
import pytest

from job_application_copilot.career_sources import load_career_sources


def test_loader_excludes_empty_files_and_non_source_documents(
    tmp_path: Path,
):
    (tmp_path / "RULES.md").write_text(
        "Use documented facts only.", encoding="utf-8"
    )
    (tmp_path / "PROFILE.md").write_text(
        "Example candidate.", encoding="utf-8"
    )

    projects = tmp_path / "projects"
    projects.mkdir()

    (projects / "receiver.md").write_text(
        "Built a receiver prototype.", encoding="utf-8"
    )
    (projects / "empty.md").write_text(" \n", encoding="utf-8")
    (projects / "README.md").write_text(
        "Project index.", encoding="utf-8"
    )
    (projects / "_PROJECT_TEMPLATE.md").write_text(
        "Template instructions.", encoding="utf-8"
    )
    (projects / "notes.txt").write_text(
        "Not a Markdown source.", encoding="utf-8"
    )

    sources = load_career_sources(tmp_path)
    sources_by_path = {
        source.source_path: source.content for source in sources
    }

    assert sources_by_path == {
        "RULES.md": "Use documented facts only.",
        "PROFILE.md": "Example candidate.",
        "projects/receiver.md": "Built a receiver prototype.",
    }

def test_loader_rejects_missing_directory(tmp_path: Path):
    missing_directory = tmp_path / "does_not_exist"

    with pytest.raises(NotADirectoryError):
        load_career_sources(missing_directory)


def test_loader_rejects_missing_profile(tmp_path: Path):
    (tmp_path / "RULES.md").write_text(
        "Use documented facts only.", encoding="utf-8"
    )

    with pytest.raises(FileNotFoundError):
        load_career_sources(tmp_path)
