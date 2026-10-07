import { useState } from "react";
import CareerSourceViewer from "./CareerSourceViewer";

export interface SelectedExperience {
  source_path: string;
  title: string;
  relevance_reason: string;
  suggested_bullets: string[];
}

export interface ApplicationDraft {
  selected_experiences: SelectedExperience[];
  missing_information: string[];
}

function DraftBulletEditor({
  text,
  onTextChange,
}: {
  text: string;
  onTextChange: (newText: string) => void;
}) {
  return (
    <textarea
      className="draft-bullet"
      aria-label="Resume bullet"
      value={text}
      onChange={(event) => onTextChange(event.target.value)}
      rows={4}
    />
  );
}

export default function ApplicationDraftResult({
  draft,
  jobDescription,
  initialIncludedPaths,
  draftId,
  onSaved,
}: {
  draft: ApplicationDraft;
  jobDescription: string;
  initialIncludedPaths?: string[];
  draftId: number | null;
  onSaved: (id: number) => void;
}) {

  const [experiences, setExperiences] = useState(
      draft.selected_experiences
  );
  const [includedPaths, setIncludedPaths] = useState<string[]>(
  initialIncludedPaths ??
    draft.selected_experiences.map((experience) => experience.source_path)
);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  async function saveDraft() {
    setSaving(true);
    setSaveMessage("");

    try {
      const url =
        draftId === null
          ? "http://127.0.0.1:8000/drafts"
          : `http://127.0.0.1:8000/drafts/${draftId}`;

      const response = await fetch(url, {
        method: draftId === null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_description: jobDescription,
          draft: {
            selected_experiences: experiences,
            missing_information: draft.missing_information,
          },
          included_paths: includedPaths,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed (HTTP ${response.status}).`);
      }

      const data: { id: number } = await response.json();
      onSaved(data.id);
      setSaveMessage(`Draft saved (ID ${data.id}).`);
    } catch (error: unknown) {
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "Could not save the draft."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateBullet(
      sourcePath: string,
      bulletIndex: number,
      newText: string
  ) {
      setSaveMessage("");
      setCopyMessage("");
      setExperiences((previous) =>
          previous.map((experience) =>
          experience.source_path === sourcePath
              ? {
                  ...experience,
                  suggested_bullets: experience.suggested_bullets.map(
                  (bullet, index) =>
                      index === bulletIndex ? newText : bullet
                  ),
              }
              : experience
          )
      );
  }

  const [copyMessage, setCopyMessage] = useState("");

  async function copyDraft() {
    setCopyMessage("");

    const draftText = experiences
      .filter((experience) =>
        includedPaths.includes(experience.source_path)
      )
      .map((experience) => {
        const bullets = experience.suggested_bullets
          .filter((bullet) => bullet.trim() !== "")
          .map((bullet) => `- ${bullet.trim()}`)
          .join("\n");

        if (!bullets) {
          return "";
        }

        const title = experience.title.trim();

        return title ? `${title}\n${bullets}` : bullets;
      })
      .filter((section) => section !== "")
      .join("\n\n");

    if (!draftText) {
      setCopyMessage("No bullet text to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(draftText);
      setCopyMessage("Draft copied.");
    } catch {
      setCopyMessage("Could not copy the draft. Please copy the text manually.");
    }
  }

  function setExperienceIncluded(sourcePath: string, included: boolean) {
    setSaveMessage("");
    setCopyMessage("");

    setIncludedPaths((currentPaths) => {
      if (included) {
        return currentPaths.includes(sourcePath)
          ? currentPaths
          : [...currentPaths, sourcePath];
      }

      return currentPaths.filter((path) => path !== sourcePath);
    });
  }

  function updateTitle(sourcePath: string, newTitle: string) {
    setSaveMessage("");
    setCopyMessage("");

    setExperiences((currentExperiences) =>
      currentExperiences.map((experience) =>
        experience.source_path === sourcePath
          ? { ...experience, title: newTitle }
          : experience
      )
    );
  }


  return (
    <section className="application-draft">
      <h2>Application Draft</h2>
      <button onClick={copyDraft}>Copy Draft</button>
      <p role="status">{copyMessage}</p>

      <button onClick={saveDraft} disabled={saving}>
        {saving ? "Saving..." : "Save Draft"}
      </button>
      <p role="status">{saveMessage}</p>

      {experiences.map((experience) => (
        <section className="draft-experience" key={experience.source_path}>
          <label>
            Experience title
            <input
              className="draft-title"
              type="text"
              value={experience.title}
              placeholder="Enter a project name or role"
              onChange={(event) =>
                updateTitle(experience.source_path, event.target.value)
              }
            />
          </label>

          <p>Source: {experience.source_path}</p>
          <CareerSourceViewer sourcePath={experience.source_path} />
          <label>
            <input
              type="checkbox"
              checked={includedPaths.includes(experience.source_path)}
              onChange={(event) =>
                setExperienceIncluded(
                  experience.source_path,
                  event.target.checked
                )
              }
            />
            Include in draft
          </label>
          <p>{experience.relevance_reason}</p>

          {experience.suggested_bullets.map((bullet, index) => (
            <DraftBulletEditor
                key={index}
                text={bullet}
                onTextChange={(newText) =>
                    updateBullet(experience.source_path, index, newText)
                }
            />
          ))}
        </section>
      ))}

      {draft.missing_information.length > 0 && (
        <section>
          <h3>Information to Confirm</h3>
          <ul>
            {draft.missing_information.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}