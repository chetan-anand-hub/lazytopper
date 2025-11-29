// src/types/MentorRequest.ts

export type MentorMode =
  | "solve"
  | "explain"
  | "plan"
  | "coach"
  | "mindset";

export interface PageContext {
  grade: "Class 10";
  subject: "Maths" | "Science";
  chapter?: string;
  topic?: string;
  questionId?: string;
  marks?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export interface StudentState {
  studentId?: string;

  // Overall planner info
  daysLeft?: number;
  targetScore?: number;           // overall target %
  hoursPerDayOverall?: number;    // total hours per day (Maths + Science)
  subjects?: ("Maths" | "Science")[];

  // Subject-wise splits
  mathTargetScore?: number;
  scienceTargetScore?: number;
  mathHoursPerDay?: number;
  scienceHoursPerDay?: number;

  // Other state we can fill later
  completedChapters?: string[];
  weakChapters?: string[];
  confidenceLevel?: "low" | "medium" | "high";
  mood?: "stressed" | "okay" | "confident" | "burnt-out" | "anxious";
}

export interface MentorMessage {
  role: "user" | "assistant";
  content: string;
  mode?: MentorMode;
}

export interface MentorRequest {
  mode: MentorMode;
  message: string;
  pageContext: PageContext;
  studentState: StudentState;
  history?: MentorMessage[];
}
