import { useState } from "react";

interface BulletRewrite {
  original_point: string;
  suggested_rewrite: string;
  reason: string;
}

export interface Analysis {
  required_skills: string[];
  matching_points: string[];
  skill_gaps: string[];
  weak_evidence: string[];
  responsibilities: string[];
  resume_keywords: string[];
  bullet_rewrites: BulletRewrite[];
  cover_letter_draft: string;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens?: number;
  estimated_cost_usd: number;
}

interface Props {
  analysis: Analysis;
  usage: Usage;
}

function BulletEditor({ bullet }: { bullet: BulletRewrite }) {
  const [editedText, setEditedText] = useState(bullet.suggested_rewrite);

  return (
    <div>
      <p><strong>Original:</strong> {bullet.original_point}</p>

      <label>
        Suggested rewrite:
        <textarea
          value={editedText}
          onChange={(event) => setEditedText(event.target.value)}
          rows={4}
        />
      </label>

      <p><strong>Why:</strong> {bullet.reason}</p>
    </div>
  );
}


function AnalysisResult({ analysis, usage }: Props) {
  return (
    <section>
      <h2>Analysis Result</h2>

      <h3>Required Skills</h3>
      <ul>
        {analysis.required_skills.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>Matching Points</h3>
      <ul>
        {analysis.matching_points.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>Skill Gaps</h3>
      <ul>
        {analysis.skill_gaps.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>Weak Evidence</h3>
      {analysis.weak_evidence.length > 0 ? (
        <ul>
          {analysis.weak_evidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No weak evidence identified.</p>
      )}

      <h3>Responsibilities</h3>
      <ul>
        {analysis.responsibilities.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>Resume Keywords</h3>
      <ul>
        {analysis.resume_keywords.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h3>Bullet Rewrites</h3>
      {analysis.bullet_rewrites.map((item, index) => (
        <BulletEditor key={index} bullet={item} />
      ))}

      <h3>Cover Letter Draft</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {analysis.cover_letter_draft}
      </p>

      <h3>Usage</h3>
      <ul>
        <li>Input tokens: {usage.input_tokens}</li>
        <li>Output tokens: {usage.output_tokens}</li>
        {usage.total_tokens !== undefined && (
          <li>Total tokens: {usage.total_tokens}</li>
        )}
        <li>
          Estimated cost: ${usage.estimated_cost_usd.toFixed(6)}
        </li>
      </ul>
    </section>
  );
}

export default AnalysisResult;