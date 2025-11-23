// src/pages/TrendsPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { class10MathTopicTrends } from "../data/class10MathTopicTrends";

type TierKey = "must-crack" | "high-roi" | "good-to-do";

const tierLabel: Record<TierKey, string> = {
  "must-crack": "Must-crack",
  "high-roi": "High-ROI",
  "good-to-do": "Good to do",
};

const tierEmoji: Record<TierKey, string> = {
  "must-crack": "🔥",
  "high-roi": "💸",
  "good-to-do": "🌈",
};

function getTier(weightagePercent: number): TierKey {
  if (weightagePercent >= 9) return "must-crack";
  if (weightagePercent >= 7) return "high-roi";
  return "good-to-do";
}

export default function TrendsPage() {
  const navigate = useNavigate();

  const topicEntries = React.useMemo(
    () =>
      Object.entries(class10MathTopicTrends.topics).sort(
        (a, b) => b[1].weightagePercent - a[1].weightagePercent
      ),
    []
  );

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Back to chapters
      </button>

      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
        Class 10 Maths – chapter & concept trends
      </h1>

      <p className="text-slate-600 mb-4">
        Darker = heavier. Hit the{" "}
        <span className="font-semibold">🔥 ones first</span>, then the{" "}
        <span className="font-semibold">💸 ones</span>. Chill with{" "}
        <span className="font-semibold">🌈</span> once the big boys are done.
      </p>

      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700">
          🔥 Must-crack
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
          💸 High-ROI
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
          🌈 Good to do
        </span>
      </div>

      <section className="space-y-4">
        {topicEntries.map(([topicName, meta]) => {
          const tier = getTier(meta.weightagePercent);

          const sortedConcepts = Object.entries(meta.conceptWeightage).sort(
            (a, b) => b[1] - a[1]
          );

          return (
            <details
              key={topicName}
              className="bg-white/70 rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              open
            >
              <summary className="cursor-pointer flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold">{topicName}</h2>
                  <p className="text-sm text-slate-500">
                    ~{meta.weightagePercent}% of Maths marks
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-700">
                    {tierEmoji[tier]} {tierLabel[tier]}
                  </span>
                  <div className="h-1.5 w-40 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                      style={{ width: `${meta.weightagePercent}%` }}
                    />
                  </div>
                </div>
              </summary>

              <div className="px-5 pb-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-2">
                  Most asked subtopics inside this chapter:
                </p>
                <ul className="text-sm text-slate-700 grid md:grid-cols-2 gap-x-6 gap-y-1">
                  {sortedConcepts.map(([concept, pct]) => (
                    <li key={concept} className="flex justify-between">
                      <span>{concept}</span>
                      <span className="text-slate-500">~{pct}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
