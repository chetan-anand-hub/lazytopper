// src/pages/TopicHub.tsx
//
// TopicHub v2 – unified topic learning page.
//
// This component implements the revamped TopicHub experience.
// It loads rich content for a given topic (from topicHubV2Content) and
// organises it into tabs for overview, learning, exam prep, practice
// and resources.  It also offers CTAs to ask the Mentor, start
// practice and view trends, and respects the back‑navigation state
// passed from previous pages.

import { useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

import getTopicV2Content, { type TopicHubV2Content } from '../utils/getTopicV2Content';
import { resolveTopicDisplayName } from '../utils/topicResolver';
import { buildTrendsUrl, buildAiMentorUrl } from '../utils/buildUrl';
import { navigateToPractice } from '../navigation/practiceNavigation';

import type { NavigationState } from '../types/navigation';

// Tier metadata for hero styling.  Colours loosely follow TopicHub v1.
const tierMeta: Record<
  string,
  {
    label: string;
    emoji: string;
    gradient: string;
  }
> = {
  'must-crack': {
    label: 'Must‑crack topic',
    emoji: '🔥',
    gradient:
      'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 25%, #f97316 65%, #facc15 100%)',
  },
  'high-roi': {
    label: 'High‑ROI topic',
    emoji: '🎯',
    gradient:
      'linear-gradient(135deg, #020617 0%, #0f172a 15%, #1d4ed8 55%, #22c1c3 100%)',
  },
  'good-to-do': {
    label: 'Good‑to‑do topic',
    emoji: '🌈',
    gradient:
      'linear-gradient(135deg, #064e3b 0%, #10b981 25%, #22c55e 65%, #a7f3d0 100%)',
  },
};

// Tab keys used in the UI.  We support a fallback for unknown keys.
type TabKey = 'overview' | 'learn' | 'exam' | 'practice' | 'resources';

export default function TopicHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const grade = (params as any).grade as string | undefined;
  const subject = (params as any).subject as string | undefined;
  // Accept either the path parameter (:topicKey) or the ?topic= query param
  const pathKey = (params as any).topicKey as string | undefined;
  const queryParams = new URLSearchParams(location.search);
  const queryTopic = queryParams.get('topic') || undefined;

  // Determine the effective topic parameter.  Prefer the query param;
  // otherwise use the path param.  Fallback to empty string if none.
  const topicParam = queryTopic || pathKey || '';

  // Look up the content record for this subject/topic.
  const content: TopicHubV2Content = useMemo(() => {
    if (!subject) {
      return {
        subject: '',
        topicKey: '',
        topicName: '',
        tier: 'high-roi',
        overview: [],
        definitions: [],
        examPatterns: [],
        markingTips: [],
        scoreTips: [],
        workedExamples: [],
        quickQuiz: [],
      };
    }
    return getTopicV2Content(subject, topicParam);
  }, [subject, topicParam]);

  // Determine the active tab.  Use ?tab= query parameter; default to
  // overview.  Only allow known tab keys.
  const tabParam = (queryParams.get('tab') || '').toLowerCase() as TabKey;
  const activeTab: TabKey = ['learn', 'exam', 'practice', 'resources'].includes(tabParam)
    ? tabParam
    : 'overview';

  // Compute the back link from state (if any).  The previous page can
  // provide a back URL and label via react-router location.state.  If
  // none is provided, default to the Trends page for this subject.
  const navState = (location.state as NavigationState | null) || {};
  const backUrl = navState.back ||
    (grade && subject ? buildTrendsUrl(grade, subject) : undefined);
  const backLabel = navState.backLabel ||
    (backUrl && backUrl.startsWith('/study-plan') ? 'Back to study plan' : 'Back');

  // Tab click handler – update the ?tab= query param.
  const setTab = (tab: TabKey) => {
    const params = new URLSearchParams(location.search);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    }, { replace: true });
  };

  // CTA handlers
  const handlePractice = () => {
    if (!grade || !subject) return;
    const slug = content.topicKey;
    // Provide backPath/backLabel so Practice page can return to this topic.
    navigateToPractice(navigate, {
      grade,
      subject: subject as any,
      topicKey: slug,
      backPath: location.pathname + location.search,
      backLabel: 'Back to topic',
      topicName: content.topicName,
    });
  };
  const handleMentorExplain = () => {
    if (!grade || !subject) return;
    navigate(buildAiMentorUrl(grade, subject), {
      state: {
        mode: 'explain',
        payload: { topic: content.topicKey },
        back: location.pathname + location.search,
        backLabel: 'Back to topic',
      },
    });
  };

  const handleBack = () => {
    if (backUrl) navigate(backUrl);
  };

  // Render nothing if subject is missing
  if (!subject) {
    return (
      <div className="page">
        <p>Error: subject not specified.</p>
      </div>
    );
  }

  const tier = tierMeta[content.tier] || tierMeta['high-roi'];
  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Back button */}
      {backUrl && (
        <button
          type="button"
          onClick={handleBack}
          className="mentor-back-button"
          style={{ marginBottom: '16px' }}
        >
          ← <span>{backLabel}</span>
        </button>
      )}

      {/* Hero section */}
      <div
        style={{
          background: tier.gradient,
          padding: '24px',
          borderRadius: '12px',
          color: '#fff',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ margin: 0 }}>{content.topicName || resolveTopicDisplayName(subject, content.topicKey)}</h2>
        <p style={{ margin: '4px 0 8px 0', opacity: 0.9 }}>
          {tier.emoji} {tier.label}
        </p>
        {content.overview && content.overview.length > 0 && (
          <p style={{ margin: 0 }}>{content.overview[0]}</p>
        )}
      </div>

      {/* Tab bar */}
      <div className="topic-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(['overview', 'learn', 'exam', 'practice', 'resources'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={tab === activeTab ? 'topic-tab active' : 'topic-tab'}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: tab === activeTab ? '#e5e7eb' : '#f9fafb' }}
          >
            {tab === 'overview'
              ? 'Overview'
              : tab === 'learn'
              ? 'Learn'
              : tab === 'exam'
              ? 'Exam'
              : tab === 'practice'
              ? 'Practice'
              : 'Resources'}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'overview' && (
        <div className="topic-tabpanel">
          {content.overview && content.overview.length > 0 ? (
            content.overview.map((line: string, idx: number) => (
              <p key={idx} style={{ marginBottom: '8px' }}>{line}</p>
            ))
          ) : (
            <p>No overview available.</p>
          )}
        </div>
      )}

      {activeTab === 'learn' && (
        <div className="topic-tabpanel">
          <h3>Definitions & Concepts</h3>
          {content.definitions && content.definitions.length > 0 ? (
            <ul style={{ paddingLeft: '16px' }}>
              {content.definitions.map((def: any, idx: number) => (
                <li key={idx} style={{ marginBottom: '8px' }}>
                  <strong>{def.title}:</strong> {def.description}
                </li>
              ))}
            </ul>
          ) : (
            <p>No definitions available.</p>
          )}
        </div>
      )}

      {activeTab === 'exam' && (
        <div className="topic-tabpanel">
          <h3>Exam Patterns & Marking Tips</h3>
          {content.examPatterns && content.examPatterns.length > 0 ? (
            <ul style={{ paddingLeft: '16px' }}>
              {content.examPatterns.map((pat: string, idx: number) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{pat}</li>
              ))}
            </ul>
          ) : (
            <p>No exam pattern information available.</p>
          )}
          {content.markingTips && content.markingTips.length > 0 && (
            <>
              <h4 style={{ marginTop: '16px' }}>Marking Tips</h4>
              <ul style={{ paddingLeft: '16px' }}>
                {content.markingTips.map((tip: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="topic-tabpanel">
          <h3>Practice Recommendations</h3>
          {content.scoreTips && content.scoreTips.length > 0 ? (
            <ul style={{ paddingLeft: '16px' }}>
              {content.scoreTips.map((tip: string, idx: number) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p>No practice suggestions available.</p>
          )}
          <button
            className="cta-btn"
            style={{ marginTop: '16px' }}
            onClick={handlePractice}
          >
            Start practice
          </button>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="topic-tabpanel">
          <h3>Ask the AI Mentor</h3>
          <p>If you're stuck, our AI Mentor can explain this topic in detail.</p>
          <button
            className="cta-btn"
            onClick={handleMentorExplain}
          >
            Explain this topic
          </button>
        </div>
      )}
    </div>
  );
}