export type ClassId = "10";

export type SubjectKey = "maths" | "science";

export type ScienceStream = "physics" | "chemistry" | "biology";

export type TopicKey =
  | "triangles"
  | "trigonometry"
  | "straight_lines"
  | "circles"
  | "statistics"
  | "probability"
  | "light_reflection_refraction"
  | "electricity"
  | "magnetic_effects_of_current"
  | "life_processes"
  | "control_and_coordination"
  | "heredity_and_evolution"
  | "chemical_reactions_and_equations"
  | "acids_bases_salts"
  | "metals_non_metals"
  | "carbon_and_its_compounds";

export type MentorMode =
  | "ConceptExplain"
  | "BoardSteps"
  | "SolveWithMe"
  | "QuickQuiz"
  | "RevisionNotes";

export type MentorVibe =
  | "CBSE_BoardTeacher"
  | "FriendlyCoach"
  | "StudentLens_Class10";

export interface TopicIdentity {
  classId: ClassId;
  subjectKey: SubjectKey;
  topicKey: TopicKey;
  stream?: ScienceStream;
  topicDisplayName?: string;
}

export interface TopicContext {
  anchorId: string;
  anchorTitle: string;
  conceptTags: string[];
  expectedMarks?: number;
  difficulty?: "Easy" | "Medium" | "Hard";
  boardExamStyle?: boolean;
  studentMistakesToTarget?: string[];
}

export interface AllowedAnchors {
  keyDefinitions?: string[];
  boardPatterns?: Array<"A" | "B" | "C" | "D" | "E">;
}

export type VisualKind =
  | "GeometryDiagram"
  | "GraphPlot"
  | "RayDiagram"
  | "CircuitDiagram"
  | "BioDiagram"
  | "ChemDiagram"
  | "ImagePrompt";

export interface VisualPolicy {
  requireVisuals: boolean;
  requireWhenConceptTags?: string[];
  preferredKinds?: VisualKind[];
  maxVisuals?: number;
  labelStyle?: "cbse_clean" | "minimal";
}

export interface MentorRequest {
  identity: TopicIdentity;
  mode: MentorMode;
  vibes: MentorVibe[];
  context: TopicContext;
  allowedAnchors?: AllowedAnchors;
  visualPolicy: VisualPolicy;
  studentAttempt?: string;
}

export interface MentorResponseMeta {
  identity: TopicIdentity;
  context: TopicContext;
  mode: MentorMode;
  vibesApplied: MentorVibe[];
  visualKindsUsed?: VisualKind[];
}

export interface BoardStep {
  text: string;
  marks: number;
  reason?: string;
}

export interface BoardStepsBlock {
  totalMarksExpected?: number;
  totalMarksEmitted: number;
  steps: BoardStep[];
  markingCheck?: string;
}

export interface QuizQuestion {
  id?: string;
  prompt: string;
  options?: string[];
  answer?: string;
  pattern?: "A" | "B" | "C" | "D" | "E";
}

export interface ExplanationBlock {
  ncertAlignedDefinition?: string;
  intuitiveExplain?: string;
  workedExample?: string;
  commonMistakes?: string[];
}

export interface MissingConfigBlock {
  missingAnchorIds: string[];
  suggestedTemplates?: string[];
}

export interface BaseVisualSpec {
  kind: VisualKind;
  id?: string;
  title?: string;
}

export interface GeometryDiagramSpec extends BaseVisualSpec {
  kind: "GeometryDiagram";
  points: Array<{ id: string; label?: string; x?: number; y?: number }>;
  segments?: Array<{ from: string; to: string; label?: string }>;
  parallels?: Array<{ a: string; b: string }>;
  rightAngles?: Array<{ at: string; between: [string, string] }>;
  ratioMarks?: Array<{ on: [string, string]; ratio?: string }>;
  angleMarks?: Array<{ at: string; label?: string; valueDeg?: number }>;
}

export interface GraphPlotSpec extends BaseVisualSpec {
  kind: "GraphPlot";
  plotType: "line" | "trig";
  domain?: { min: number; max: number };
  series: Array<{ label?: string; equation?: string; points?: Array<{ x: number; y: number }> }>;
  highlights?: Array<{ x?: number; y?: number; label?: string }>;
}

export interface RayDiagramSpec extends BaseVisualSpec {
  kind: "RayDiagram";
  elements: Array<{
    id: string;
    type: "mirror" | "lens" | "prism" | "object" | "screen";
    position?: string;
    label?: string;
    radius?: number;
    focalLength?: number;
  }>;
  rays: Array<{ from: string; to: string; style?: string }>;
}

export interface CircuitDiagramSpec extends BaseVisualSpec {
  kind: "CircuitDiagram";
  nodes: Array<{ id: string; label?: string }>;
  components: Array<{
    id: string;
    type: "battery" | "resistor" | "ammeter" | "voltmeter" | "switch" | "wire" | "lamp";
    from: string;
    to: string;
    label?: string;
    value?: string;
  }>;
}

export interface BioDiagramSpec extends BaseVisualSpec {
  kind: "BioDiagram";
  parts: Array<{ id: string; label: string; description?: string }>;
  links?: Array<{ from: string; to: string; label?: string }>;
}

export interface ChemDiagramSpec extends BaseVisualSpec {
  kind: "ChemDiagram";
  apparatus: Array<{ id: string; type: string; label?: string }>;
  links?: Array<{ from: string; to: string; label?: string }>;
  notes?: string[];
}

export interface ImagePromptSpec extends BaseVisualSpec {
  kind: "ImagePrompt";
  prompt: string;
}

export type VisualSpec =
  | GeometryDiagramSpec
  | GraphPlotSpec
  | RayDiagramSpec
  | CircuitDiagramSpec
  | BioDiagramSpec
  | ChemDiagramSpec
  | ImagePromptSpec;

export interface MentorResponse {
  meta: MentorResponseMeta;
  coreAnswer?: {
    shortAnswer?: string;
    finalAnswer?: string;
  };
  boardSteps?: BoardStepsBlock;
  explanation?: ExplanationBlock;
  quiz?: { questions: QuizQuestion[] };
  visuals?: VisualSpec[];
  missingConfig?: MissingConfigBlock;
}
