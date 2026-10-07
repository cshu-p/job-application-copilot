from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class AnalysisRecord(Base):
    __tablename__ = "analysis_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    job_description: Mapped[str] = mapped_column(Text)
    resume: Mapped[str] = mapped_column(Text)

    analysis_json: Mapped[str] = mapped_column(Text)

    input_tokens: Mapped[int] = mapped_column(Integer)
    output_tokens: Mapped[int] = mapped_column(Integer)
    estimated_cost_usd: Mapped[str] = mapped_column(String)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class ApplicationDraftRecord(Base):
    __tablename__ = "application_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    job_description: Mapped[str] = mapped_column(Text)
    draft_json: Mapped[str] = mapped_column(Text)
    included_paths_json: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
    )