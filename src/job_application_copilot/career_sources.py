from pathlib import Path
from pydantic import BaseModel


class CareerSource(BaseModel):
    source_path: str
    content: str

def load_career_sources(profile_directory: Path) -> list[CareerSource]:
    if not profile_directory.is_dir():
        raise NotADirectoryError(
            f"Career profile directory does not exist: {profile_directory}"
        )

    source_files = [
        profile_directory / "RULES.md",
        profile_directory / "PROFILE.md",
    ]

    for folder_name in ("experience", "projects"):
        folder = profile_directory / folder_name

        for source_file in sorted(folder.glob("*.md")):
            if source_file.name in {"README.md", "_PROJECT_TEMPLATE.md"}:
                continue

            source_files.append(source_file)

    sources: list[CareerSource] = []

    for source_file in source_files:
        content = source_file.read_text(encoding="utf-8").strip()

        if not content:
            continue

        sources.append(
            CareerSource(
                source_path=source_file.relative_to(profile_directory).as_posix(),
                content=content,
            )
        )

    return sources


def format_career_sources(sources: list[CareerSource]) -> str:
    sections: list[str] = []

    for source in sources:
        sections.append(
            f"Source: {source.source_path}\n\n{source.content}"
        )

    return "\n\n---\n\n".join(sections)

