// src/pages/TrigChapter.tsx
import { useNavigate } from "react-router-dom";
import { topicWeightage } from "../data/weightage";

type BandKey = "high" | "medium" | "low";

interface BandInfo {
  band: BandKey;
  label: string;
  color: string;
  blurb: string;
}

/**
 * Decide which priority band a trig subtopic belongs to.
 * You can tweak this mapping later if you want.
 */
function classifySubtopic(name: string): BandInfo {
  const lower = name.toLowerCase();

  if (
    lower.includes("identities") ||
    lower.includes("heights") ||
    lower.includes("distance")
  ) {
    return {
      band: "high",
      label: "Boss Level 🔥",
      color: "#ffb400",
      blurb: "High weightage + concept-heavy. Master these first.",
    };
  }

  if (lower.includes("standard") || lower.includes("ratios")) {
    return {
      band: "medium",
      label: "Must-Crack ✅",
      color: "#29b87a",
      blurb: "Core scoring areas. Lots of direct questions.",
    };
  }

  return {
    band: "low",
    label: "Chill but Useful 😎",
    color: "#ff9ae6",
    blurb: "Lower direct weight but supports other topics.",
  };
}

export default function TrigChapter() {
  const navigate = useNavigate();

  // Pull trig chapter info from our central weightage data
  const trigTopic =
    topicWeightage["10"].math.find((t) => t.id === "trigonometry") || null;

  const subtopics = trigTopic?.subtopics ?? [];

  const grouped: Record<BandKey, string[]> = {
    high: [],
    medium: [],
    low: [],
  };

  subtopics.forEach((st) => {
    const info = classifySubtopic(st);
    grouped[info.band].push(st);
  });

  return (
    <div className="page">
      {/* Header */}
      <h2 className="title">Class 10 – Trigonometry</h2>
      <p className="subtitle">
        Your trig command center. Start with high-impact topics, then lock in
        marks with smart quizzes and PYQ-style practice.
      </p>

      {/* Weightage card */}
      <div className="card">
        <h3>📊 Board Importance</h3>
        {trigTopic ? (
          <p>
            Approx. board weightage:{" "}
            <strong>{trigTopic.weightMarks} marks</strong> out of 80 in Maths.
            <br />
            That’s a big chunk for one chapter — perfect for smart, lazy
            toppers.
          </p>
        ) : (
          <p>Weightage data missing (we can wire this later).</p>
        )}
      </div>

      {/* Priority bands */}
      <div className="card">
        <h3>🧩 Trig Topics by Priority</h3>
        <p className="subtitle">
          Start from <strong>Boss Level</strong> if exams are near. If you have
          time, clear all three tiers.
        </p>

        {/* High */}
        <TopicBandSection
          title="Boss Level 🔥"
          blurb="High weightage, tough but super rewarding."
          color="#ffb400"
          topics={grouped.high}
        />

        {/* Medium */}
        <TopicBandSection
          title="Must-Crack ✅"
          blurb="Standard board favourites. Easy marks if you practise."
          color="#29b87a"
          topics={grouped.medium}
        />

        {/* Low */}
        <TopicBandSection
          title="Chill but Useful 😎"
          blurb="Lower direct weight, but helps with application and MCQs."
          color="#ff9ae6"
          topics={grouped.low}
        />
      </div>

      {/* Tools / Actions */}
      <div className="card">
        <h3>🛠️ LazyTopper Tools for Trig</h3>

        {/* QUIZ ROW */}
        <div className="tool-row">
          <div>
            <div className="tool-title">15Q Smart Quiz</div>
            <div className="tool-subtitle">
              PYQ-style mix of ratios, identities, standard values and height &
              distance problems. New set every attempt.
            </div>
          </div>
          <button
            className="cta-btn"
            onClick={() => navigate("/chapter/trigonometry/quiz")}
          >
            Start 15Q Quiz
          </button>
        </div>

        {/* FLASHCARDS ROW */}
        <div className="tool-row">
          <div>
            <div className="tool-title">Formula Flashcards</div>
            <div className="tool-subtitle">
              Swipe through all key trig formulas + standard values in under 5
              minutes.
            </div>
          </div>
          <button
            className="cta-btn"
            onClick={() => navigate("/chapter/trigonometry/flashcards")}
          >
            Open Flashcards
          </button>
        </div>

        {/* PYQ PACKS ROW */}
        <div className="tool-row">
          <div>
            <div className="tool-title">PYQ Practice Packs</div>
            <div className="tool-subtitle">
              Hand-picked CBSE-style questions grouped by marks and patterns.
              (Coming soon)
            </div>
          </div>
          <button className="cta-btn" disabled>
            Coming Soon
          </button>
        </div>

        {/* YOUTUBE ROW */}
        <div className="tool-row">
          <div>
            <div className="tool-title">YouTube Boost Playlist</div>
            <div className="tool-subtitle">
              Short, high-yield videos for last-minute revision. (Coming soon)
            </div>
          </div>
          <button className="cta-btn" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Back navigation */}
      <div className="card">
        <p className="subtitle">
          Done with trig for now? Jump back to all chapters and pick your next
          boss fight.
        </p>
        <button
          className="cta-btn"
          style={{ background: "#3467d6", color: "#fff" }}
          onClick={() => navigate("/chapters")}
        >
          Back to Chapters
        </button>
      </div>
    </div>
  );
}

// Small helper component for each priority band section
interface TopicBandSectionProps {
  title: string;
  blurb: string;
  color: string;
  topics: string[];
}

function TopicBandSection({
  title,
  blurb,
  color,
  topics,
}: TopicBandSectionProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 600 }}>{title}</span>
        <span
          style={{
            fontSize: "0.7rem",
            padding: "3px 8px",
            borderRadius: 999,
            backgroundColor: color,
            color: "#111",
            fontWeight: 700,
          }}
        >
          {topics.length} topic{topics.length === 1 ? "" : "s"}
        </span>
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          color: "#bdbdbd",
          marginBottom: 6,
        }}
      >
        {blurb}
      </p>
      {topics.length === 0 ? (
        <p className="subtitle" style={{ fontSize: "0.8rem" }}>
          Nothing tagged here yet.
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {topics.map((t) => (
            <span key={t} className="tag-chip" style={{ borderColor: color }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
