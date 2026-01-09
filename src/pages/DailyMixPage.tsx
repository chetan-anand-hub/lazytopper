/**
 * Path: src/DailyMixPage.tsx
 *
 * Purpose:
 * App.tsx routes refer to "./DailyMixPage". This page acts as a thin wrapper
 * that renders the existing DailyMixPlayer experience.
 *
 * Note:
 * DailyMixPlayer is expected to exist at "src/components/DailyMixPlayer.tsx"
 * (as per MS-D7 file list). If your repo places it elsewhere, only adjust
 * this single import.
 */
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DailyMixPlayer from '../components/DailyMixPlayer';

type RouteParams = {
  grade?: string;
  subject?: string;
};

export default function DailyMixPage() {
  const navigate = useNavigate();
  const { grade, subject } = useParams<RouteParams>();

  // Normalize params (keep robust even if route doesn't provide them).
  const safeGrade = useMemo(() => (grade ? String(grade) : '10'), [grade]);
  const safeSubject = useMemo(() => (subject ? String(subject) : 'maths'), [subject]);

  return (
    <div className="page">
      <DailyMixPlayer
        grade={safeGrade}
        subject={safeSubject}
        onExit={() => navigate('/dashboard')}
      />
    </div>
  );
}
