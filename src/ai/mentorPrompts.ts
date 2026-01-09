// Baseline AI Mentor prompt definitions for the host application.  This file
// mirrors the structure of the prompts shipped with the LazyTopper feature
// module and exports the same types and constant.  By keeping the shape
// consistent here, the host app can import the prompts without running into
// circular definition errors.

export type MentorPersonaId =
  | 'solve'
  | 'explain'
  | 'markingScheme'
  | 'plan'
  | 'topicRecap';

export type VibeMode = 'beast' | 'zombie';

export interface MentorPromptConfig {
  /** Full system / role prompt to send to the model for this persona + vibe. */
  prompt: string;
  /** Short human-readable description of the desired tone / style. */
  tone: string;
}

export type MentorPrompts = Record<
  MentorPersonaId,
  Record<VibeMode, MentorPromptConfig>
>;

// This placeholder mentorPrompts object can be filled with real prompts or
// imported from the feature module.  To avoid circular dependencies, do
// not import this file back into itself.  Instead, import from
// `../next_phase_final/src/ai/mentorPrompts` when using the LazyTopper prompts.
export const mentorPrompts: MentorPrompts = {
  solve: {
    beast: {
      prompt: '',
      tone: '',
    },
    zombie: {
      prompt: '',
      tone: '',
    },
  },
  explain: {
    beast: { prompt: '', tone: '' },
    zombie: { prompt: '', tone: '' },
  },
  markingScheme: {
    beast: { prompt: '', tone: '' },
    zombie: { prompt: '', tone: '' },
  },
  plan: {
    beast: { prompt: '', tone: '' },
    zombie: { prompt: '', tone: '' },
  },
  topicRecap: {
    beast: { prompt: '', tone: '' },
    zombie: { prompt: '', tone: '' },
  },
};