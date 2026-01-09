// src/services/sessionLogger.ts
//
// A lightweight session logger for study sessions.  It provides
// functions to start a session, record activities and end a session.
// Logs can be persisted to local storage or sent to a backend later.

export type ActivityType =
  | "practice"
  | "dailyMix"
  | "hpq"
  | "topicHub"
  | "mock"
  | "mentor";

// Represents a single activity in a study session.  Additional fields
// (e.g. question IDs, scores) can be added as needed.
export interface StudySessionActivity {
  timestamp: string;
  type: ActivityType;
  topicKey?: string;
  questionIds?: string[];
  score?: number;
  durationMinutes?: number;
}

// Represents a study session log.  Each session has a unique ID and
// records the start/end times and all activities performed.
export interface StudySessionLog {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  energyLevel?: "Low" | "High";
  activities: StudySessionActivity[];
}

// Internal storage for the current session and log history.  In a real
// implementation these would be persisted via IndexedDB or sent to a
// backend API.
let currentSession: StudySessionLog | null = null;
const logs: StudySessionLog[] = [];

// Generate a random ID for sessions.  Replace with a UUID library if
// available.
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Start a new study session.  If a session is already in progress it
 * will be closed and stored in the log history.
 *
 * @param userId The ID of the user starting the session.
 * @param energyLevel The energy/vibe level for this session (optional).
 */
export function startSession(userId: string, energyLevel?: "Low" | "High"): void {
  if (currentSession) {
    endSession();
  }
  currentSession = {
    id: generateId(),
    userId,
    startTime: new Date().toISOString(),
    energyLevel,
    activities: [],
  };
}

/**
 * Log an activity within the current session.  If no session is in
 * progress this call is ignored.
 *
 * @param activity Partial activity data to record.
 */
export function logActivity(activity: Omit<StudySessionActivity, "timestamp">): void {
  if (!currentSession) return;
  currentSession.activities.push({
    timestamp: new Date().toISOString(),
    ...activity,
  });
}

/**
 * End the current study session.  Sets the endTime and stores the
 * session in history.  If no session is in progress this call is
 * ignored.
 */
export function endSession(): void {
  if (!currentSession) return;
  currentSession.endTime = new Date().toISOString();
  logs.push(currentSession);
  currentSession = null;
}

/**
 * Get all recorded study sessions.  In a real app this might fetch
 * from local storage or a backend service.
 */
export function getStudyLogs(): StudySessionLog[] {
  return logs;
}