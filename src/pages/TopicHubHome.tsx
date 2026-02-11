import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { RequireAuth } from "../components/auth/RequireAuth";
import { topicHubV2Content } from "../data/topicHubV2Full";
import { useSmartLearning } from "../engine/smartLearningStore";
import type { ChapterMeta } from "../engine/smartLearningTypes";
import { loadTopicMasterySnapshot } from "../services/topicHubMastery";
import { normalizeTopicKey } from "../utils/topicHubV2Store";

type SubjectTitle = "Maths" | "Science";
type TierLabel = "must-crack" | "high-roi" | "good-to-do" | "topic";

type TopicOption = {
  key: string;
  name: string;
  tier: TierLabel;
};

type LastTopicHubRoute = {
  grade: string;
  subject: SubjectTitle;
  topicKey: string;
  topicName?: string;
  path: string;
  updatedAt: string;
};

const TOPICHUB_LAST_ROUTE_KEY = "lazytopper.topicHub.lastRoute.v1";
const TOPICHUB_RECENT_TOPICS_KEY = "lazytopper.topicHub.recentTopics.v1";

type RecentTopicRecord = {
  grade: string;
  subject: SubjectTitle;
  topicKey: string;
  topicName?: string;
  path: string;
  updatedAt: string;
};

function toSubjectTitle(raw: unknown): SubjectTitle {
  return String(raw || "").toLowerCase().includes("science") ? "Science" : "Maths";
}

function toTierLabel(raw: unknown): TierLabel {
  const value = String(raw || "").toLowerCase();
  if (value.includes("must")) return "must-crack";
  if (value.includes("high")) return "high-roi";
  if (value.includes("good")) return "good-to-do";
  return "topic";
}

function tierRank(tier: TierLabel): number {
  if (tier === "must-crack") return 0;
  if (tier === "high-roi") return 1;
  if (tier === "good-to-do") return 2;
  return 3;
}

function buildTopicOptions(subject: SubjectTitle): TopicOption[] {
  const out: TopicOption[] = [];
  for (const key of Object.keys(topicHubV2Content || {})) {
    const recRaw = (topicHubV2Content as Record<string, unknown>)[key];
    if (!recRaw || typeof recRaw !== "object") continue;
    const rec = recRaw as Record<string, unknown>;
    const recSubject = toSubjectTitle(rec.subject);
    if (recSubject !== subject) continue;
    out.push({
      key: String(rec.topicKey || key),
      name: String(rec.topicName || key),
      tier: toTierLabel(rec.tier),
    });
  }
  out.sort((a, b) => {
    const byTier = tierRank(a.tier) - tierRank(b.tier);
    if (byTier !== 0) return byTier;
    return a.name.localeCompare(b.name);
  });
  return out;
}

function readLastRoute(): LastTopicHubRoute | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOPICHUB_LAST_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastTopicHubRoute>;
    if (!parsed || typeof parsed !== "object") return null;
    const topicKey = normalizeTopicKey(String(parsed.topicKey || ""));
    const grade = String(parsed.grade || "").trim();
    const path = String(parsed.path || "").trim();
    if (!topicKey || !grade || !path) return null;
    return {
      grade,
      subject: toSubjectTitle(parsed.subject),
      topicKey,
      topicName: String(parsed.topicName || "").trim() || topicKey,
      path,
      updatedAt: String(parsed.updatedAt || ""),
    };
  } catch {
    return null;
  }
}

function formatUpdatedAt(value: string): string {
  const ts = Date.parse(String(value || ""));
  if (!Number.isFinite(ts)) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function readRecentTopics(subject: SubjectTitle): RecentTopicRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TOPICHUB_RECENT_TOPICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentTopicRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && item.subject === subject && item.topicKey && item.path)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function TopicHubHomeContent() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { getMatchScoreForChapter } = useSmartLearning();
  const [lastRoute] = useState<LastTopicHubRoute | null>(() => readLastRoute());

  const [grade, setGrade] = useState<string>(() => {
    const value = String(sp.get("grade") || lastRoute?.grade || "10").trim();
    return value || "10";
  });
  const [subject, setSubject] = useState<SubjectTitle>(() =>
    toSubjectTitle(sp.get("subject") || lastRoute?.subject || "Maths")
  );
  const [query, setQuery] = useState<string>("");
  const [recentTopics, setRecentTopics] = useState<RecentTopicRecord[]>([]);

  const topicOptions = useMemo(() => buildTopicOptions(subject), [subject]);

  useEffect(() => {
    setRecentTopics(readRecentTopics(subject));
  }, [subject]);

  const [selectedTopicKeyRaw, setSelectedTopicKeyRaw] = useState<string>(() => {
    const rawQueryTopic = String(sp.get("topic") || "").trim();
    const normalized = normalizeTopicKey(rawQueryTopic);
    if (normalized) return normalized;
    const preferredSubject = toSubjectTitle(sp.get("subject") || lastRoute?.subject || "Maths");
    if (lastRoute?.subject === preferredSubject) {
      return normalizeTopicKey(lastRoute.topicKey) || "";
    }
    return "";
  });

  const selectedTopicKey = useMemo(() => {
    if (!topicOptions.length) return "";
    const normalizedSelected = normalizeTopicKey(selectedTopicKeyRaw);
    const hasSelected = topicOptions.some((item) => item.key === normalizedSelected);
    if (hasSelected && normalizedSelected) return normalizedSelected;

    const rawTopic = String(sp.get("topic") || "").trim();
    const normalizedQueryTopic = normalizeTopicKey(rawTopic);
    if (normalizedQueryTopic) {
      const fromQuery = topicOptions.find((item) => item.key === normalizedQueryTopic);
      if (fromQuery) return fromQuery.key;
    }

    if (lastRoute?.subject === subject) {
      const fromLast = topicOptions.find(
        (item) => item.key === normalizeTopicKey(lastRoute.topicKey)
      );
      if (fromLast) return fromLast.key;
    }

    return topicOptions[0].key;
  }, [lastRoute, selectedTopicKeyRaw, sp, subject, topicOptions]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topicOptions;
    return topicOptions.filter((item) =>
      `${item.name} ${item.key} ${item.tier}`.toLowerCase().includes(q)
    );
  }, [query, topicOptions]);

  const selectedTopic = useMemo(
    () => topicOptions.find((item) => item.key === selectedTopicKey) || null,
    [selectedTopicKey, topicOptions]
  );

  const maxBoardWeightageForSubject = useMemo(() => {
    const values = topicOptions
      .map((item) => {
        const rec = (topicHubV2Content as Record<string, unknown>)[item.key] as Record<
          string,
          unknown
        >;
        return Number(rec?.weightagePercent ?? rec?.approxWeightage ?? 0);
      })
      .filter((v) => Number.isFinite(v) && v > 0);
    return values.length ? Math.max(...values) : 14;
  }, [topicOptions]);

  const matchScoreByTopic = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of topicOptions) {
      const rec = (topicHubV2Content as Record<string, unknown>)[item.key] as Record<
        string,
        unknown
      >;
      const chapterMeta: ChapterMeta = {
        id: `${grade}-${subject}-${item.key}`,
        grade: String(grade || "10"),
        subject,
        topicKey: item.key,
        name: item.name,
        boardWeightage: Number(rec?.weightagePercent ?? rec?.approxWeightage ?? 0),
        tier: item.tier === "topic" ? "high-roi" : item.tier,
      };
      out[item.key] = getMatchScoreForChapter(chapterMeta, maxBoardWeightageForSubject);
    }
    return out;
  }, [topicOptions, grade, subject, getMatchScoreForChapter, maxBoardWeightageForSubject]);

  const masteryHint = useMemo(() => {
    if (!selectedTopicKey) return "Pick a topic to start.";
    const snapshot = loadTopicMasterySnapshot(selectedTopicKey);
    const records = Object.values(snapshot.nodes || {});
    if (!records.length) {
      return "New topic. Start Learn and attempt the first checkpoint.";
    }
    const needsPractice = records.filter((rec) => rec.state === "needs_practice").length;
    const mastered = records.filter((rec) => rec.state === "mastered").length;
    const passed = records.filter(
      (rec) => rec.state === "checkpoint_passed" || rec.state === "mastered"
    ).length;
    return `Mastered ${mastered}/${records.length}, checkpoint-passed ${passed}/${records.length}, needs-practice ${needsPractice}.`;
  }, [selectedTopicKey]);

  const goToSelectedTopic = () => {
    if (!selectedTopicKey) return;
    const target = `/topic-hub/${encodeURIComponent(grade)}/${encodeURIComponent(
      subject
    )}/${encodeURIComponent(selectedTopicKey)}`;
    navigate(target);
  };

  const goToLastRoute = () => {
    if (!lastRoute?.path) return;
    navigate(lastRoute.path);
  };

  const selectedTier = selectedTopic?.tier || "topic";

  return (
    <div className="page">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 32px" }}>
        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(255,255,255,0.9)",
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.2 }}>TopicHub</div>
          <div style={{ marginTop: 6, opacity: 0.76 }}>
            One place to Learn, Grind, and revise with human-tutor flow.
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(15,23,42,0.1)",
            background: "rgba(255,255,255,0.88)",
            padding: 16,
            marginBottom: 14,
          }}
          data-ux-priority-block="topichub-entry-flow"
          data-testid="topichub-priority-block"
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>3-step flow</div>
          <div style={{ marginTop: 8, opacity: 0.82, lineHeight: 1.5 }}>
            1. Pick subject and topic. 2. Learn with tutor checkpoints. 3. Move to Grind and Practice for mastery.
          </div>
        </div>

        {lastRoute ? (
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(37,99,235,0.28)",
              background: "rgba(239,246,255,0.75)",
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>Continue where you left off</div>
            <div style={{ marginTop: 6, opacity: 0.88 }}>
              Class {lastRoute.grade} {lastRoute.subject} -{" "}
              {lastRoute.topicName || lastRoute.topicKey}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Last opened: {formatUpdatedAt(lastRoute.updatedAt) || "recently"}
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="pill"
                onClick={goToLastRoute}
                data-ux-above-fold-cta="topichub"
              >
                Resume topic
              </button>
            </div>
          </div>
        ) : null}

        {recentTopics.length > 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(15,23,42,0.09)",
              background: "rgba(255,255,255,0.86)",
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>Recent topics</div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {recentTopics.map((topic) => (
                <button
                  key={`${topic.grade}:${topic.subject}:${topic.topicKey}`}
                  type="button"
                  className="pill"
                  style={{ padding: "7px 10px", fontSize: 13 }}
                  onClick={() => navigate(topic.path)}
                >
                  {topic.topicName || topic.topicKey}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            borderRadius: 18,
            border: "1px solid rgba(15,23,42,0.08)",
            background: "rgba(255,255,255,0.86)",
            padding: 16,
          }}
        >
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
            <div style={{ gridColumn: "span 12" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Class</div>
              <select
                value={grade}
                onChange={(event) => setGrade(String(event.target.value || "10"))}
                style={{
                  width: "100%",
                  border: "1px solid rgba(15,23,42,0.18)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 15,
                  background: "#fff",
                }}
              >
                <option value="10">Class 10</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Subject</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["Maths", "Science"] as SubjectTitle[]).map((value) => {
                  const active = value === subject;
                  return (
                    <button
                      key={value}
                      type="button"
                      className="pill"
                      style={{
                        padding: "8px 12px",
                        background: active ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.9)",
                        color: active ? "#fff" : "rgba(15,23,42,0.9)",
                        borderColor: active ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.22)",
                      }}
                      onClick={() => setSubject(value)}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Find topic</div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(String(event.target.value || ""))}
                placeholder="Search topic"
                style={{
                  width: "100%",
                  border: "1px solid rgba(15,23,42,0.18)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 15,
                  background: "#fff",
                }}
              />
            </div>

            <div style={{ gridColumn: "span 12" }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>Topic</div>
              <select
                value={selectedTopicKey}
                onChange={(event) => setSelectedTopicKeyRaw(String(event.target.value || ""))}
                style={{
                  width: "100%",
                  border: "1px solid rgba(15,23,42,0.18)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 15,
                  background: "#fff",
                }}
              >
                {filteredOptions.length ? (
                  filteredOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.name} ({option.tier} | {matchScoreByTopic[option.key] ?? 0}% match)
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No topics found for this search
                  </option>
                )}
              </select>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "rgba(248,250,252,0.9)",
              padding: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.78 }}>Selected:</span>
              <span style={{ fontWeight: 900 }}>{selectedTopic?.name || "None"}</span>
              {selectedTopic ? (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    borderRadius: 999,
                    border: "1px solid rgba(22,163,74,0.45)",
                    padding: "2px 8px",
                    background: "rgba(220,252,231,0.95)",
                    color: "rgba(22,101,52,1)",
                  }}
                >
                  {matchScoreByTopic[selectedTopic.key] ?? 0}% Match
                </span>
              ) : null}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  borderRadius: 999,
                  border: "1px solid rgba(15,23,42,0.22)",
                  padding: "2px 8px",
                  background:
                    selectedTier === "must-crack"
                      ? "rgba(254,226,226,0.9)"
                      : selectedTier === "high-roi"
                      ? "rgba(254,249,195,0.95)"
                      : "rgba(220,252,231,0.95)",
                }}
              >
                {selectedTier}
              </span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.82, marginTop: 6 }}>{masteryHint}</div>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="pill"
              style={{ padding: "10px 14px" }}
              data-ux-above-fold-cta="topichub"
              onClick={goToSelectedTopic}
              disabled={!selectedTopicKey}
            >
              Start Learning
            </button>
            <button
              type="button"
              className="pill"
              style={{ padding: "10px 14px" }}
              data-ux-above-fold-cta="topichub"
              onClick={() => navigate(`/trends/${encodeURIComponent(grade)}/${encodeURIComponent(subject)}`)}
            >
              See trends (optional)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopicHubHome() {
  return (
    <RequireAuth>
      <TopicHubHomeContent />
    </RequireAuth>
  );
}
