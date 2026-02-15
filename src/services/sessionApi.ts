import type { SessionItem } from "./sessionTypes";

const API_BASE = "/api";

export type SessionKind = "daily_mix" | "chapter" | "hpq" | "revision" | "mock";
export type SessionSubjectId = "maths" | "science";
export type SessionVibe = "low" | "high";

export interface SessionDoc {
  sessionId: string;
  createdAt: number;
  updatedAt: number;
  owner: string;
  kind: SessionKind;
  subjectId: SessionSubjectId;
  chapterId?: string;
  vibe: SessionVibe;
  items: SessionItem[];
  cursor: number;
  completed: boolean;
  answers?: Record<string, unknown>;
  metrics?: {
    attempts: number;
    correct: number;
  };
}

export interface StartSessionRequest {
  kind: SessionKind;
  subjectId?: SessionSubjectId;
  chapterId?: string;
  vibe?: SessionVibe;
}

export interface StartSessionResponse {
  ok: boolean;
  sessionId: string;
  session: SessionDoc;
}

export interface GetSessionResponse {
  ok: boolean;
  session: SessionDoc;
}

export interface SubmitSessionResponse {
  ok: boolean;
  feedback: {
    ok: boolean;
    correct: boolean;
    score: number;
    expected: string;
    missingKeywords: string[];
    nextCursor: number;
    completed: boolean;
  };
  session: SessionDoc;
}

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let json: unknown = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Invalid JSON response: ${raw.slice(0, 200)}`);
  }
  if (!res.ok) {
    const err = json as Record<string, unknown>;
    throw new Error(String(err.error || err.message || `Request failed (${res.status})`));
  }
  return json as T;
}

export async function startSession(req: StartSessionRequest): Promise<StartSessionResponse> {
  const res = await fetch(`${API_BASE}/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readJsonOrThrow<StartSessionResponse>(res);
}

export async function getSession(sessionId: string): Promise<GetSessionResponse> {
  const id = encodeURIComponent(String(sessionId || ""));
  const res = await fetch(`${API_BASE}/session/${id}`);
  return readJsonOrThrow<GetSessionResponse>(res);
}

export async function submitSessionAnswer(
  sessionId: string,
  itemId: string,
  answer: string
): Promise<SubmitSessionResponse> {
  const id = encodeURIComponent(String(sessionId || ""));
  const res = await fetch(`${API_BASE}/session/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, answer }),
  });
  return readJsonOrThrow<SubmitSessionResponse>(res);
}
