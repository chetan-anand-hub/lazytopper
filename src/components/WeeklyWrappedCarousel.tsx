import React, { useState } from 'react';
import type { WeeklyWrappedSummary } from '../services/weeklyWrappedGenerator';

/**
 * A lightweight carousel component for displaying Weekly Wrapped
 * statistics. The summary prop should come from your Weekly Wrapped
 * aggregator. This component demonstrates slide transitions and basic
 * presentation of key metrics (accuracy, strong/weak topics,
 * distributions). A production version would follow the S8 spec more
 * closely with polished visuals and accessibility features.
 */
export interface WeeklyWrappedCarouselProps {
  summary: WeeklyWrappedSummary;
  onClose: () => void;
  onShare?: () => void;
}

interface Slide {
  title: string;
  content: React.ReactNode;
}

export const WeeklyWrappedCarousel: React.FC<WeeklyWrappedCarouselProps> = ({ summary, onClose, onShare }) => {
  const slides: Slide[] = [
    {
      title: 'Your Study Stats',
      content: (
        <div>
          <p>Total attempts: {summary.totalAttempts}</p>
          <p>Correct answers: {summary.totalCorrect}</p>
          <p>Accuracy: {(summary.accuracy * 100).toFixed(1)}%</p>
        </div>
      ),
    },
    {
      title: 'Strong & Weak Topics',
      content: (
        <div>
          <p><strong>Strong:</strong> {summary.strongTopics.join(', ') || 'None yet'}</p>
          <p><strong>Weak:</strong> {summary.weakTopics.join(', ') || 'None yet'}</p>
        </div>
      ),
    },
    {
      title: 'Difficulty Distribution',
      content: (
        <ul>
          {Object.entries(summary.difficultyCounts).map(([level, count]) => (
            <li key={level}>{level}: {count}</li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Bloom Skills',
      content: (
        <ul>
          {Object.entries(summary.bloomCounts).map(([skill, count]) => (
            <li key={skill}>{skill}: {count}</li>
          ))}
        </ul>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  const nextSlide = () => setIndex((i) => (i + 1 < slides.length ? i + 1 : i));
  const prevSlide = () => setIndex((i) => (i - 1 >= 0 ? i - 1 : 0));

  const current = slides[index];
  return (
    <div className="weekly-wrapped-carousel" style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{current.title}</h2>
        <div>
          <button onClick={prevSlide} disabled={index === 0}>‹</button>
          <button onClick={nextSlide} disabled={index === slides.length - 1}>›</button>
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>{current.content}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div>
          {slides.map((_, i) => (
            <span key={i} style={{ marginRight: '4px', fontSize: '0.8rem' }}>{i === index ? '●' : '○'}</span>
          ))}
        </div>
        <div>
          {onShare && <button onClick={onShare}>Share</button>}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};