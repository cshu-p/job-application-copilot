# Job Application Copilot

Generate resume-content drafts tailored to a job description using documented career experience. Review the sources, edit titles and bullets, select relevant experiences, and copy the result for use in a resume.

The model is instructed to avoid unsupported claims and preserve personal contribution boundaries. Generated content still requires human review before use.

## Features

- Generate relevant experience titles, selection explanations, and resume bullets.
- View current source text to verify suggested content.
- Edit titles and bullets, select experiences, and copy selected content.
- Save, restore, and update drafts in a local database.
- Browse the latest 50 saved drafts, ordered by their most recent update.
- Access the earlier resume-comparison workflow through **Legacy Analysis**.

## Architecture

The frontend uses React, TypeScript, and Vite. The backend uses FastAPI and Pydantic for API validation, Pydantic AI for model calls, and SQLAlchemy for access to SQLite.

The current model configuration is `openai:gpt-5.6-luna` in `src/job_application_copilot/main.py`.

```text
React frontend
    → FastAPI backend
        → Local Markdown career sources
        → OpenAI model through Pydantic AI
        → SQLite database through SQLAlchemy
```

Generation and saving are separate operations. `POST /draft` generates content; `POST /drafts` creates a saved record; `PUT /drafts/{id}` updates an existing record. Reading, editing, copying, and saving an existing draft do not call the model.

### Data flow

When generating a draft, the backend sends the loaded career-source text and job description to the configured OpenAI model. Legacy analysis sends the supplied resume and job description to the model.

Saved drafts and legacy analysis records are stored in `job_copilot.db`. With the startup command below, this file is created in the project root. `.env` and `job_copilot.db` are excluded from Git.

## Setup

### Requirements

- Python 3.13 or later and `uv`.
- Node.js satisfying Vite's requirement: `^20.19.0 || >=22.12.0`, and npm.
- An OpenAI API key with access to the configured model.
- A local career-source directory.

### Career sources

Use a separate directory for personal career facts:

```text
career-profile/
├── RULES.md
├── PROFILE.md
├── experience/
│   └── example_role.md
└── projects/
    └── example_project.md
```

`RULES.md` and `PROFILE.md` are required files. Use `RULES.md` for resume-generation constraints and `PROFILE.md` for background such as education and skills. Store work and research records under `experience/`, and project records under `projects/`.

Document personal contributions, team-level features, uncertainties, and supporting evidence. The loader reads non-empty `.md` files directly inside these two folders, excluding `README.md` and `_PROJECT_TEMPLATE.md`. It does not recursively read subfolders or load coursework and previously generated resumes.

Keep private career sources outside this public project. Use fictional source data for public demonstrations.

### Configuration

Create `.env` in the project root:

```dotenv
OPENAI_API_KEY=your_api_key
CAREER_PROFILE_DIRECTORY=/absolute/path/to/career-profile
```

Replace the placeholders with your own values. Restart the backend after changing `.env`.

### Backend

From the project root:

```bash
uv sync
uv run uvicorn job_application_copilot.main:app --reload
```

The backend runs at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend

In a separate terminal, from the project root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The backend currently allows this origin through CORS, and frontend API requests target `http://127.0.0.1:8000`.

## Usage

1. Paste a job description, including the title, responsibilities, minimum qualifications, and preferred qualifications. Multiline text is supported.
2. Select **Generate Draft** to create suggestions from the career sources.
3. Use **View Source** to verify claims. Edit titles and bullets, and choose which experiences to include.
4. Select **Copy Draft** to copy selected titles and non-empty bullets. Source paths and selection explanations are not included.
5. Select **Save Draft** to store the complete draft and selection state. Subsequent saves update the same record.
6. Open a record from **Saved Drafts** to restore its job description, edited content, and selections.

Opening or generating another draft replaces the current editor, including unsaved edits. Save changes before switching drafts. Editing the main job-description input does not change the job description associated with the current draft; generate a new draft for a different role.

## Evaluations

Two manual evaluation examples record expected behavior and observations:

- [RF / Embedded](evals/rf_embedded.md): contribution scope, RF claims, and measurement wording.
- [Backend / Full-stack](evals/backend_fullstack.md): relevant selection and separation of personal contributions from team-level features.

Both cases passed with minor wording corrections after human review. These are manual observations, not automated tests or a guarantee of future generation accuracy.

To check the frontend build, run from the project root:

```bash
cd frontend
npm run build
```

## Limitations

- Output is an experience-content draft, not a complete, submission-ready resume.
- Human review is required for factual accuracy, contribution scope, and wording.
- Source-path validation checks references against loaded sources; it does not prove every claim is supported.
- **View Source** displays current source text, not a snapshot from generation time. Loaded text is cached in the viewer until the editor is recreated.
- This version does not provide PDF export or automated application submission.
- The application is intended for local use and has no user authentication or multi-user access controls.
