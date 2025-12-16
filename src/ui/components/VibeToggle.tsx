// src/ui/components/VibeToggle.tsx
//
// Component: VibeToggle
//
// Provides a UI for selecting the current vibe mode (Beast vs Zombie). This
// version is adapted to use the new vibe context API which exposes
// `mode` and `setMode` instead of `level`/`setLevel`.  It preserves all
// existing logic: loading from and persisting to localStorage, displaying
// microcopy from vibeCommandBadgeCopy, and showing hints based on the
// selected mode.  Backwards compatibility is maintained by translating
// legacy saved values ("High"/"Low") into the new enum ("beast"/"zombie").

import React, { useEffect } from 'react';
import { useVibeMode } from '../../context/vibeModeContext';
import { vibeCommandBadgeCopy } from '../microcopy/vibeCommandBadgeCopy';

/**
 * Local storage key used to persist the selected vibe mode between sessions.
 */
const VIBE_STORAGE_KEY = 'lazyTopper.vibeMode';

export const VibeToggle: React.FC = () => {
  const { mode, setMode } = useVibeMode();
  const copy = vibeCommandBadgeCopy.vibeToggle;

  // Load persisted vibe on mount.  Accept both new ('beast'/'zombie') and
  // legacy ('High'/'Low') values for backwards compatibility.
  useEffect(() => {
    const saved = localStorage.getItem(VIBE_STORAGE_KEY);
    if (saved === 'beast' || saved === 'zombie') {
      setMode(saved as any);
    } else if (saved === 'High' || saved === 'Low') {
      setMode(saved === 'High' ? 'beast' : 'zombie');
    }
  }, [setMode]);

  // Persist vibe on change.  Always write the new enum to storage.
  useEffect(() => {
    if (mode) {
      localStorage.setItem(VIBE_STORAGE_KEY, mode);
    }
  }, [mode]);

  return (
    <div className="vibe-toggle-container" title={copy.globalTooltip}>
      <h3 className="vibe-toggle-heading">
        {copy.headerEmoji} {copy.mainLabel}
      </h3>
      <p className="vibe-toggle-subtitle">{copy.subtitle}</p>
      <div className="vibe-toggle-buttons">
        <button
          type="button"
          className={`vibe-button ${mode === 'beast' ? 'active' : ''}`}
          onClick={() => setMode('beast')}
          title={copy.beast.tooltip}
        >
          <strong>{copy.beast.label}</strong>
          <span className="vibe-subtext">{copy.beast.subtextShort}</span>
        </button>
        <button
          type="button"
          className={`vibe-button ${mode === 'zombie' ? 'active' : ''}`}
          onClick={() => setMode('zombie')}
          title={copy.zombie.tooltip}
        >
          <strong>{copy.zombie.label}</strong>
          <span className="vibe-subtext">{copy.zombie.subtextShort}</span>
        </button>
      </div>
      <small className="vibe-hints">
        {mode === 'beast'
          ? copy.hints.beastHeader
          : mode === 'zombie'
          ? copy.hints.zombieHeader
          : ''}
      </small>
    </div>
  );
};

export default VibeToggle;