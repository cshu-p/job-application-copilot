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




function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] =
    useState<HistoryDetail | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function analyzeJob() {
  setLoading(true);

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

    const data: AnalysisResponse = await response.json();
    setResult(data);
    await loadHistory();
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

  return (
    <main>
      <h1>Job Application Copilot</h1>

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

          <h2>Resume</h2>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            rows={10}
            cols={80}
            placeholder="Paste your resume here..."
          />

          <button onClick={analyzeJob} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </section>

        <section className="history-panel">
          <h2>History</h2>

          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <button onClick={() => loadHistoryDetail(item.id)}>
                  #{item.id} - {item.job_description}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

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

    </main>
  );
}

export default App;