import { useEffect, useState } from "react";
import AnalysisResult, {
  type Analysis,
  type Usage,
} from "./components/AnalysisResult";
import "./App.css";

interface HistoryItem {
  id: number;
  created_at: string;
  job_description: string;
}

interface HistoryDetail {
  id: number;
  created_at: string;
  job_description: string;
  resume: string;
  analysis: Analysis;
  usage: Usage;
}

interface AnalysisResponse {
  analysis_id: number;
  analysis: Analysis;
  usage: Usage;
}

interface SavedDraftSummary {
  id: number;
  job_description_preview: string;
  updated_at: string;
}

interface SavedDraftDetail {
  id: number;
  job_description: string;
  draft: ApplicationDraft;
  included_paths: string[];
  created_at: string;
  updated_at: string;
}

import ApplicationDraftResult, {
  type ApplicationDraft,
} from "./components/ApplicationDraftResult";


function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] =
    useState<HistoryDetail | null>(null);

  const [errorMessage, setErrorMessage] = useState< string | null>(null);
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [draftJobDescription, setDraftJobDescription] = useState("");
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftSummary[]>([]);
  const [draftListError, setDraftListError] = useState("");
  const [draftIncludedPaths, setDraftIncludedPaths] = useState<string[] | undefined>(undefined);
  const [draftEditorVersion, setDraftEditorVersion] = useState(0);
  const [draftId, setDraftId] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
    loadSavedDrafts();
  }, []);

  async function analyzeJob() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_description: jobDescription,
          resume: resume,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed, HTTP ${response.status}.`);
      }

      const data: AnalysisResponse = await response.json();
      setResult(data);
      await loadHistory();
    } catch(error: unknown) {
      const message = error instanceof Error ? error.message: "An unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  async function generateDraft() {

    setDraft(null);
    setLoading(true);
    setErrorMessage(null);

    const submittedJobDescription = jobDescription;

    try {
      const response = await fetch("http://127.0.0.1:8000/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_description: submittedJobDescription,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (HTTP ${response.status}).`);
      }

      const data: ApplicationDraft = await response.json();
      setDraftJobDescription(submittedJobDescription);
      setDraft(data);
      setDraftIncludedPaths(undefined);
      setDraftEditorVersion((version) => version + 1);
      setDraftId(null);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    const response = await fetch("http://127.0.0.1:8000/history");
    const data: HistoryItem[] = await response.json();
    setHistory(data);
  }

  async function loadHistoryDetail(id: number) {
    const response = await fetch(`http://127.0.0.1:8000/history/${id}`);
    const data: HistoryDetail = await response.json();
    setSelectedHistory(data);
  }

  async function loadSavedDrafts() {
    setDraftListError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/drafts");

      if (!response.ok) {
        throw new Error(`Could not load drafts (HTTP ${response.status}).`);
      }

      const data: SavedDraftSummary[] = await response.json();
      setSavedDrafts(data);
    } catch (error: unknown) {
      setDraftListError(
        error instanceof Error
          ? error.message
          : "Could not load saved drafts."
      );
    }
  }

  async function openSavedDraft(id: number) {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`http://127.0.0.1:8000/drafts/${id}`);

      if (!response.ok) {
        throw new Error(`Could not open draft (HTTP ${response.status}).`);
      }

      const data: SavedDraftDetail = await response.json();

      setJobDescription(data.job_description);
      setDraftJobDescription(data.job_description);
      setDraftIncludedPaths(data.included_paths);
      setDraft(data.draft);
      setDraftEditorVersion((version) => version + 1);
      setDraftId(data.id);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not open the draft."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDraftSaved(id: number) {
    setDraftId(id);
    void loadSavedDrafts();
  }

  return (
    <main>
      <h1>Job Application Copilot</h1>
      {errorMessage && (<p role="alert">{errorMessage}</p>)}

      <div className="top-layout">
        <section className="input-panel">
          <h2>Job Description</h2>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={10}
            cols={80}
            placeholder="Paste the job description here..."
          />

          <button onClick={generateDraft} disabled={loading}>
            Generate Draft
          </button>

        </section>

        <section className="history-panel">
          <h2>Saved Drafts</h2>
          <button onClick={loadSavedDrafts}>Refresh Drafts</button>

          {draftListError && <p role="alert">{draftListError}</p>}

          <ul>
            {savedDrafts.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => openSavedDraft(item.id)}
                  disabled={loading}
                >
                  Open Draft #{item.id} — {item.job_description_preview}
                </button>
              </li>
            ))}
          </ul>
          {!draftListError && savedDrafts.length === 0 && (
            <p>No saved drafts loaded.</p>
          )}

        </section>
      </div>


      {draft && (
        <ApplicationDraftResult
          key={draftEditorVersion}
          draft={draft}
          jobDescription={draftJobDescription}
          initialIncludedPaths={draftIncludedPaths}
          draftId={draftId}
          onSaved={handleDraftSaved}
        />
      )}


      <details className="legacy-analysis">
        <summary>Legacy Analysis</summary>

        <div className="input-panel">
          <p>Compare a resume with the job description entered above.</p>

          <label>
            Resume
            <textarea
              value={resume}
              onChange={(event) => setResume(event.target.value)}
              rows={10}
              placeholder="Paste your resume here..."
            />
          </label>

          <button onClick={analyzeJob} disabled={loading}>
            Analyze Resume
          </button>
        </div>

        <h2>Analysis History</h2>

        <ul>
          {history.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => loadHistoryDetail(item.id)}
                disabled={loading}
              >
                #{item.id} — {item.job_description}
              </button>
            </li>
          ))}
        </ul>

        {result && (
          <AnalysisResult
            analysis={result.analysis}
            usage={result.usage}
          />
        )}

        {selectedHistory && (
          <section>
            <h2>Saved Analysis #{selectedHistory.id}</h2>
            <AnalysisResult
              analysis={selectedHistory.analysis}
              usage={selectedHistory.usage}
            />
          </section>
        )}
      </details>
    </main>
  );
}

export default App;
