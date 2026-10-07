import { useState } from "react";

interface CareerSource {
  source_path: string;
  content: string;
}

export default function CareerSourceViewer({
  sourcePath,
}: {
  sourcePath: string;
}) {
  const [source, setSource] = useState<CareerSource | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function toggleSource() {
    if (expanded) {
      setExpanded(false);
      return;
    }

    if (source !== null) {
      setExpanded(true);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const query = new URLSearchParams({
        source_path: sourcePath,
      });

      const response = await fetch(
        `http://127.0.0.1:8000/sources?${query.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Could not load source (HTTP ${response.status}).`);
      }

      const data: CareerSource = await response.json();
      setSource(data);
      setExpanded(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load the source."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggleSource}
        disabled={loading}
        aria-expanded={expanded}
      >
        {loading ? "Loading..." : expanded ? "Hide Source" : "View Source"}
      </button>

      {errorMessage && <p role="alert">{errorMessage}</p>}

      {expanded && source && (
        <section>
          <p>Current source text</p>
          <pre className="career-source-text">{source.content}</pre>
        </section>
      )}
    </div>
  );
}
