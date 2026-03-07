export type CbseFormat = "A" | "B" | "C" | "D" | "E";

export interface LearningObject {
  loId: string;
  title: string;
  description: string;
  prerequisites?: string[];
  commonMistakes?: string[];
  boardWritingTip?: string;
  masteryRule?: { attempts: number; accuracy: number };
}

export interface QuestionTypeTile {
  qtypeId: string;
  title: string;
  cbseFormat: CbseFormat;
  skillFamily: string;
  typicalMarks?: number[];
  loIds: string[];
}

export interface QuestionMeta {
  questionId: string;
  cbseFormat?: CbseFormat;
  skillFamily?: string;
  loIds: string[];
  mistakeTags?: string[];
  scopeGuard?: string[];
  msAlignment?: "template" | "partial-credit" | "final-only";
  reviewTags?: string[];
}
