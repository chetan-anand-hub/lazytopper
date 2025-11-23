// src/pages/TrendsPage.tsx

import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { class10MathTopicTrends } from "../data/class10MathTopicTrends";
import { class10ScienceTopicTrends } from "../data/class10ScienceTopicTrends";

// --- Local types -------------------------------------------------

type TierKey = "must-crack" | "high-roi" | "good-to-do";
type SubjectKey = "Maths" | "Science";

// minimal shape we expect from both Maths + Science trend files
interface TopicMeta {
  tier?: TierKey;
  weightagePercent?: number;
  summary?: string;
  conceptWeightage?: Record<string, number>;
}

interface TopicTrendsData {
  subject: string;
  grade: string;
  topics: Record<string, TopicMeta>;
}

// --- Small helpers -----------------------------------------------

const tierMeta: Record<
  TierKey,
  { label: string; emoji: string; blurb: string }
> = {
  "must-crack": {
    label: "Must-crack",
    emoji: "🔥",
    blurb: "Appears almost every year – do these first.",
  },
  "high-roi": {
    label: "High-ROI",
    emoji: "💎",
    blurb: "Great marks for the time spent – do after must-crack.",
  },
  "good-to-do": {
    label: "Good-to-do",
    emoji: "🌈",
    blurb: "Safety net + confidence once core topics are done.",
  },
};

function normaliseSubject(raw?: string): SubjectKey {
  const val = (raw || "").toLowerCase();
  if (val === "science" || val === "sci") return "Science";
  return "Maths";
}

function pickDataset(subject: SubjectKey): TopicTrendsData {
  if (subject === "Science") {
    return class10ScienceTopicTrends as unknown as TopicTrendsData;
  }
  return class10MathTopicTrends as unknown as TopicTrendsData;
}

// --- Component ---------------------------------------------------

const TrendsPage: React.FC = () => {
  const navigate = useNavigate();

  // gives us { grade?: string; subject?: string }
  const params = useParams<"grade" | "subject">();

  const grade = params.grade || "10";
  const subjectKey = normaliseSubject(params.subject);
  const trendsData = pickDataset(subjectKey);

  const topicEntries = useMemo(
    () => Object.entries(trendsData.topics),
    [trendsData]
  );

  const totalWeightage = topicEntries.reduce(
    (sum, [, meta]) => sum + (meta.weightagePercent ?? 0),
    0
  );

  const handleBackToChapters = () => {
    navigate("/chapters");
  };

  const handleSubjectToggle = (next: SubjectKey) => {
    navigate(`/trends/${grade}/${next}`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Back link */}
        <button
          onClick={handleBackToChapters}
          className="text-slate-600 text-sm flex items-center gap-1 hover:text-slate-800"
        >
          <span>←</span>
          <span>Back to trends hub</span>
        </button>

        {/* Hero */}
        <header className="rounded-3xl px-6 py-6 md:px-8 md:py-7 bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600 text-slate-50 shadow-2xl shadow-slate-900/70 flex flex-col gap-3">
          <div className="text-xs tracking-[0.25em] uppercase opacity-80">
            Exam Vogue • Class {grade} • {subjectKey}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold leading-snug">
            Class {grade} {subjectKey} Topic Hub
          </h1>
          <p className="text-sm md:text-base max-w-3xl opacity-90">
            Use the filters to see <strong>must-crack</strong>,{" "}
            <strong>high-ROI</strong> and <strong>good-to-do</strong> chapters
            based on CBSE board trends and your predictive model. Tap any card
            to open its full concept notes, examples, and board tips.
          </p>

          {/* Subject toggle pills */}
          <div className="mt-2 inline-flex items-center gap-2 bg-slate-900/40 rounded-full p-1">
            {(["Maths", "Science"] as SubjectKey[]).map((subj) => {
              const active = subj === subjectKey;
              return (
                <button
                  key={subj}
                  onClick={() => handleSubjectToggle(subj)}
                  className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition ${
                    active
                      ? "bg-slate-50 text-slate-900 shadow-lg"
                      : "text-slate-100/80 hover:bg-slate-800/70"
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>
        </header>

        {/* Difficulty + section vibe (simple, mostly static for now) */}
        <section className="rounded-3xl bg-white/80 border border-slate-200 shadow-xl px-5 py-4 space-y-3">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-slate-800">
              Difficulty mix
            </div>
            <div className="flex items-center gap-3 text-xs md:text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Easy 40%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Medium 40%
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-600 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Hard 20%
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs text-slate-700 pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                Section A (MCQs / Objective, 1 mark, 20 Qs)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                Section B (Very Short Answer, 2 marks, 6 Qs)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                Section C (Short Answer, 3 marks, 8 Qs)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                Section D (Long Answer, 4–5 marks, 4–6 Qs)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                Section E (Case-based, 4 marks)
              </span>
            </div>
          </div>
        </section>

        {/* Topic list */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Class {grade} {subjectKey} — chapter &amp; concept trends
            </h2>
            <div className="text-[11px] md:text-xs text-slate-500">
              Total weightage covered:{" "}
              <span className="font-semibold text-slate-700">
                {totalWeightage}%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {topicEntries.map(([topicName, meta]) => {
              const tier: TierKey =
                meta.tier && (tierMeta as any)[meta.tier]
                  ? (meta.tier as TierKey)
                  : "good-to-do";

              const sortedConcepts = Object.entries(
                meta.conceptWeightage ?? {}
              ).sort((a, b) => b[1] - a[1]);

              return (
                <details
                  key={topicName}
                  className="bg-white/70 rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                  open
                >
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base md:text-lg font-semibold text-slate-900">
                          {topicName}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-700">
                          {tierMeta[tier].emoji} {tierMeta[tier].label}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 mt-1">
                        {meta.summary || tierMeta[tier].blurb}
                      </p>
                    </div>
                    <div className="text-xs md:text-sm text-slate-500 whitespace-nowrap">
                      ~{meta.weightagePercent ?? 0}% of paper
                    </div>
                  </summary>

                  {/* Concept list */}
                  {sortedConcepts.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/70">
                      <p className="text-xs md:text-sm text-slate-600 mb-2">
                        Most asked subtopics inside this chapter:
                      </p>
                      <ul className="text-sm text-slate-700 grid md:grid-cols-2 gap-x-6 gap-y-1">
                        {sortedConcepts.map(([concept, pct]) => (
                          <li
                            key={concept}
                            className="flex justify-between gap-3"
                          >
                            <span>{concept}</span>
                            <span className="text-slate-500">
                              ~{pct}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrendsPage;
