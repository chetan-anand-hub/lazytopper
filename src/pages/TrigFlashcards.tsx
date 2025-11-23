// src/pages/TrigFlashcards.tsx
import { useMemo, useState } from "react";
import {
  TRIG_FLASHCARDS,
  type FlashTag,
  type TrigFlashcard,
} from "../data/trigFlashcards";
import { useNavigate } from "react-router-dom";

const TAG_LABELS: Record<FlashTag | "all", string> = {
  all: "All",
  ratios: "Ratios",
  identities: "Identities",
  "standard-values": "Standard Values",
  "heights-distances": "Heights & Distances",
  tips: "LazyTopper Tips",
};

export default function TrigFlashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [activeTag, setActiveTag] = useState<FlashTag | "all">("all");
  const navigate = useNavigate();

  const cards: TrigFlashcard[] = useMemo(() => {
    if (activeTag === "all") return TRIG_FLASHCARDS;
    return TRIG_FLASHCARDS.filter(
      (c: TrigFlashcard) => c.tag === activeTag
    );
  }, [activeTag]);

  const current: TrigFlashcard | null =
    cards.length > 0 ? cards[currentIndex] : null;

  const total = cards.length;

  const goNext = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
    setShowBack(false);
  };

  const goPrev = () => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setShowBack(false);
  };

  const handleShuffle = () => {
    if (total === 0) return;
    const random = Math.floor(Math.random() * total);
    setCurrentIndex(random);
    setShowBack(false);
  };

  return (
    <div className="page">
      <h2 className="title">Trig Formula Flashcards</h2>
      <p className="subtitle">
        Swipe (or tap next) through the most important trigonometry formulas and
        ideas. Perfect for last-minute revision.
      </p>

      {/* Tag filter chips */}
      <div className="card">
        <h3>Filter</h3>
        <div className="flash-tag-row">
          {(Object.keys(TAG_LABELS) as (FlashTag | "all")[]).map(
            (tagKey: FlashTag | "all") => (
              <button
                key={tagKey}
                className="flash-tag-btn"
                data-active={activeTag === tagKey}
                onClick={() => {
                  setActiveTag(tagKey);
                  setCurrentIndex(0);
                  setShowBack(false);
                }}
              >
                {TAG_LABELS[tagKey]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Flashcard itself */}
      <div className="card flashcard-shell">
        {current ? (
          <>
            <div className="flashcard-meta">
              <span>
                Card {currentIndex + 1} of {total}
              </span>
              <span className="flashcard-tag-pill">
                {TAG_LABELS[current.tag]}
              </span>
            </div>

            <div
              className="flashcard"
              onClick={() => setShowBack((b) => !b)}
              title="Click to flip"
            >
              <h3>{current.title}</h3>
              <p>
                {(showBack ? current.back : current.front)
                  .split("\n")
                  .map((line: string, i: number) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
              </p>
              <div className="flashcard-footer">
                {showBack ? "Tap to see question" : "Tap to see answer"}
              </div>
            </div>

            <div className="flashcard-controls">
              <button className="cta-btn ghost" onClick={goPrev}>
                ◀ Prev
              </button>
              <button className="cta-btn ghost" onClick={handleShuffle}>
                🔀 Random
              </button>
              <button className="cta-btn ghost" onClick={goNext}>
                Next ▶
              </button>
            </div>
          </>
        ) : (
          <p className="subtitle">
            No cards found for this filter. (This should not happen – we always
            have some cards!)
          </p>
        )}
      </div>

      <div className="card">
        <button
          className="cta-btn"
          onClick={() => navigate("/chapter/trigonometry")}
        >
          Back to Trig Dashboard
        </button>
      </div>
    </div>
  );
}
