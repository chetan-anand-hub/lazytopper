/**
 * Path: src/pages/WeeklyWrappedPage.tsx
 *
 * WeeklyWrappedPage
 *
 * A standalone page that displays the Weekly Wrapped story. It aggregates
 * the learner's practice attempts over the past week and passes the resulting
 * summary into the carousel component. If there are no attempts during the
 * interval, the page renders a friendly message encouraging the student to practise.
 * A close button returns the user to the dashboard; a share button can be wired up
 * later to export the story as an image or link.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAttempts } from '../services/practiceInsights';
import { generateWeeklyWrapped } from '../services/weeklyWrappedGenerator';
import { WeeklyWrappedCarousel } from '../components/WeeklyWrappedCarousel';

export default function WeeklyWrappedPage() {
  const navigate = useNavigate();

  // Compute the date range for the past 7 days
  const end = Date.now();
  const start = end - 7 * 24 * 60 * 60 * 1000;

  // Load all attempts in this interval
  const attempts = useMemo(() => getAttempts({ start, end }), [start, end]);
  const summary = useMemo(
    () => generateWeeklyWrapped(attempts, { start, end }),
    [attempts, start, end]
  );

  // Handlers for closing and sharing. Sharing can later be implemented via canvas
  // or social API; for now it alerts.
  const handleClose = () => navigate('/dashboard');
  const handleShare = () => {
    // TODO: implement proper share functionality (e.g. generate image)
    window.alert('Sharing is not implemented yet.');
  };

  return (
    <div className="page">
      <h2 className="title">Weekly Wrapped</h2>

      {summary.totalAttempts === 0 ? (
        <p>
          No study data for the past week yet. Practise some questions to see your
          progress!
        </p>
      ) : (
        <WeeklyWrappedCarousel summary={summary} onClose={handleClose} onShare={handleShare} />
      )}
    </div>
  );
}
