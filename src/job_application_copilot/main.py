from fastapi import FastAPI
from pydantic import BaseModel
from pydantic_ai import Agent
from dotenv import load_dotenv
import json
from .database import Base, SessionLocal, engine
from .models import AnalysisRecord
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

class AnalysisRequest(BaseModel):
    job_description: str
    resume: str

class BulletRewrite(BaseModel):
    original_point: str
    suggested_rewrite: str
    reason: str

class JobAnalysis(BaseModel):
    required_skills: list[str]
    matching_points: list[str]
    skill_gaps: list[str]
    weak_evidence: list[str]
    responsibilities: list[str]
    resume_keywords: list[str]
    bullet_rewrites: list[BulletRewrite]
    cover_letter_draft: str


agent = Agent(
    "openai:gpt-5.6-luna",
    output_type=JobAnalysis,
    instructions=(
        "You are a job application assistant. "
        "Compare the candidate's resume against the job description. "
        "Extract required skills and explicitly stated responsibilities. "
        "Identify matching points supported by the resume. "
        "Separate true skill gaps from areas where the resume evidence is weak. "
        "Suggest resume bullet rewrites that better emphasize relevant existing experience. "
        "Never invent employers, projects, metrics, technologies, responsibilities, "
        "or accomplishments that are not supported by the resume. "
        "If a stronger bullet would require missing facts or metrics, say so in the reason "
        "instead of fabricating them."
        "Do not repeat missing required skills in weak_evidence. "
        "Use weak_evidence only for skills or experiences that are present in the resume but insufficiently demonstrated."
        "Each bullet rewrite must only use facts contained in that original bullet, "
        "unless the resume clearly shows the facts belong to the same project or role."
        "Write a concise cover letter draft tailored to the job description. "
        "Use only facts supported by the resume. "
        "Emphasize the strongest matching qualifications. "
        "Do not claim experience with skills listed as gaps. "
        "Do not explicitly call attention to skill gaps in the cover letter unless the user asks for that. "
        "Do not invent company names, metrics, achievements, or responsibilities. "
        "If the employer or hiring manager name is unknown, use a neutral greeting."
        "Keep the cover letter to roughly 150-250 words. "
        "Focus on concrete qualifications rather than generic enthusiasm."
    ),
)





@app.get("/")
def root():
    return {"message": "Job Application Copilot is running"}

@app.post("/analyze")
async def analyze_job(request: AnalysisRequest):
    result = await agent.run(
        f"""
Job Description:
{request.job_description}

Candidate Resume:
{request.resume}
"""
    )

    usage = result.usage

    input_tokens = usage.input_tokens or 0
    output_tokens = usage.output_tokens or 0

    estimated_cost = (
        input_tokens / 1_000_000 * 0.20
        + output_tokens / 1_000_000 * 1.20
    )

    with SessionLocal() as db:
        record = AnalysisRecord(
            job_description=request.job_description,
            resume=request.resume,
            analysis_json=result.output.model_dump_json(),
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=str(round(estimated_cost, 6)),
        )

        db.add(record)
        db.commit()
        db.refresh(record)

    return {
        "analysis_id": record.id,
        "analysis": result.output,
        "usage": {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "estimated_cost_usd": round(estimated_cost, 6),
        },
    }

@app.get("/history")
def get_history():
    with SessionLocal() as db:
        records = (
            db.query(AnalysisRecord)
            .order_by(AnalysisRecord.id.desc())
            .all()
        )

        return [
            {
                "id": record.id,
                "created_at": record.created_at,
                "job_description": record.job_description[:100],
            }
            for record in records
        ]

@app.get("/history/{analysis_id}")
def get_analysis(analysis_id: int):
    with SessionLocal() as db:
        record = db.get(AnalysisRecord, analysis_id)

        if record is None:
            return {"error": "Analysis not found"}

        return {
            "id": record.id,
            "created_at": record.created_at,
            "job_description": record.job_description,
            "resume": record.resume,
            "analysis": json.loads(record.analysis_json),
            "usage": {
                "input_tokens": record.input_tokens,
                "output_tokens": record.output_tokens,
                "estimated_cost_usd": float(record.estimated_cost_usd),
            },
        }
